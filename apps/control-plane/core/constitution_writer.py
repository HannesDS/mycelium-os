"""ConstitutionWriterService — applies approved constitution changes atomically.

Dual-write strategy (git first, then DB):
1. Validate the change payload.
2. Compute the new YAML state in memory.
3. Write YAML files to disk (git-backed config path).
4. Record the ConstitutionChange row in DB.
5. Reload in-memory state (controller + config).

If step 3 fails → mark approval failed, raise, no DB write.
If step 4 fails after step 3 → log error (YAML is source of truth; DB history is
best-effort). The change is still applied on disk.
"""
from __future__ import annotations

import logging
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml
from sqlalchemy.orm import Session

from core.manifest import (
    MyceliumConfig,
    ShroomManifest,
    ShroomMetadata,
    ShroomSpec,
    load_mycelium_config,
    load_shroom_manifest,
)
from core.models import Approval, ConstitutionChange

logger = logging.getLogger(__name__)

VALID_CHANGE_TYPES = frozenset(
    {"add_shroom", "edit_shroom", "remove_shroom", "edit_company", "edit_graph_edge", "remove_graph_edge"}
)


class ConstitutionWriteError(Exception):
    """Raised when the constitution write fails (git/disk write step)."""


class InvalidChangePayload(ValueError):
    """Raised when the change payload is structurally invalid."""


# ---------------------------------------------------------------------------
# Payload validation
# ---------------------------------------------------------------------------


def _validate_shroom_id(shroom_id: Any) -> str:
    if not isinstance(shroom_id, str) or not shroom_id.strip():
        raise InvalidChangePayload("shroom_id must be a non-empty string")
    if not re.match(r"^[a-z0-9][a-z0-9\-]*[a-z0-9]$", shroom_id):
        raise InvalidChangePayload(
            f"shroom_id '{shroom_id}' must be lowercase alphanumeric with hyphens, "
            "must start and end with alphanumeric"
        )
    return shroom_id


def validate_change_payload(payload: dict) -> None:
    change_type = payload.get("change_type")
    if change_type not in VALID_CHANGE_TYPES:
        raise InvalidChangePayload(
            f"change_type must be one of {sorted(VALID_CHANGE_TYPES)}, got {change_type!r}"
        )

    if change_type == "add_shroom":
        _validate_shroom_id(payload.get("shroom_id", ""))
        spec = payload.get("spec", {})
        if not isinstance(spec, dict):
            raise InvalidChangePayload("spec must be a dict for add_shroom")
        if not spec.get("name"):
            raise InvalidChangePayload("spec.name is required for add_shroom")

    elif change_type == "edit_shroom":
        _validate_shroom_id(payload.get("shroom_id", ""))
        if not isinstance(payload.get("updates", {}), dict):
            raise InvalidChangePayload("updates must be a dict for edit_shroom")

    elif change_type == "remove_shroom":
        _validate_shroom_id(payload.get("shroom_id", ""))

    elif change_type == "edit_company":
        updates = payload.get("updates", {})
        if not isinstance(updates, dict) or not updates:
            raise InvalidChangePayload("updates must be a non-empty dict for edit_company")

    elif change_type in ("edit_graph_edge", "remove_graph_edge"):
        for field in ("from_shroom", "to_shroom"):
            _validate_shroom_id(payload.get(field, ""))
        if change_type == "edit_graph_edge":
            edge_type = payload.get("edge_type")
            if not isinstance(edge_type, str) or not edge_type.strip():
                raise InvalidChangePayload("edge_type must be a non-empty string")


# ---------------------------------------------------------------------------
# State computation
# ---------------------------------------------------------------------------


def _config_to_snapshot(config: MyceliumConfig, manifests: dict[str, ShroomManifest]) -> dict:
    """Produce a JSON-serialisable snapshot of the current constitution."""
    shroom_snapshots = {}
    for sid, m in manifests.items():
        shroom_snapshots[sid] = {
            "name": m.metadata.name,
            "model": m.spec.model,
            "skills": m.spec.skills,
            "escalates_to": m.spec.escalates_to,
            "sla_response_minutes": m.spec.sla_response_minutes,
            "can": m.spec.can,
            "cannot": m.spec.cannot,
            "mcps": m.spec.mcps,
        }
    return {
        "company": dict(config.company),
        "shrooms": shroom_snapshots,
        "graph": config.graph,
    }


def _apply_change_to_state(
    payload: dict,
    config: MyceliumConfig,
    manifests: dict[str, ShroomManifest],
    config_path: Path,
) -> tuple[MyceliumConfig, dict[str, ShroomManifest]]:
    """Return a new (config, manifests) tuple with the change applied."""
    change_type = payload["change_type"]

    # Work on mutable copies
    new_company = dict(config.company)
    new_graph = dict(config.graph) if config.graph else {}
    new_manifests = dict(manifests)
    shroom_paths = list(config.shrooms)  # list of rel paths

    if change_type == "add_shroom":
        shroom_id = payload["shroom_id"]
        spec = payload["spec"]
        if shroom_id in new_manifests:
            raise InvalidChangePayload(f"Shroom '{shroom_id}' already exists")
        new_manifest = ShroomManifest(
            apiVersion="mycelium.io/v1",
            kind="Shroom",
            metadata=ShroomMetadata(id=shroom_id, name=spec["name"]),
            spec=ShroomSpec(
                model=spec.get("model", "mistral-7b"),
                skills=spec.get("skills", []),
                escalates_to=spec.get("escalates_to"),
                sla_response_minutes=spec.get("sla_response_minutes"),
                can=spec.get("can", []),
                cannot=spec.get("cannot", []),
                mcps=spec.get("mcps", []),
            ),
        )
        new_manifests[shroom_id] = new_manifest
        rel_path = f"examples/shrooms/{shroom_id}.yaml"
        shroom_paths = shroom_paths + [rel_path]

    elif change_type == "edit_shroom":
        shroom_id = payload["shroom_id"]
        if shroom_id not in new_manifests:
            raise InvalidChangePayload(f"Shroom '{shroom_id}' not found")
        existing = new_manifests[shroom_id]
        updates = payload["updates"]
        new_spec_data = {
            "model": existing.spec.model,
            "skills": list(existing.spec.skills),
            "escalates_to": existing.spec.escalates_to,
            "sla_response_minutes": existing.spec.sla_response_minutes,
            "can": list(existing.spec.can),
            "cannot": list(existing.spec.cannot),
            "mcps": list(existing.spec.mcps),
        }
        new_spec_data.update(updates)
        new_name = updates.get("name", existing.metadata.name)
        new_manifests[shroom_id] = ShroomManifest(
            apiVersion="mycelium.io/v1",
            kind="Shroom",
            metadata=ShroomMetadata(id=shroom_id, name=new_name),
            spec=ShroomSpec(**{k: v for k, v in new_spec_data.items() if k != "name"}),
        )

    elif change_type == "remove_shroom":
        shroom_id = payload["shroom_id"]
        if shroom_id not in new_manifests:
            raise InvalidChangePayload(f"Shroom '{shroom_id}' not found")
        del new_manifests[shroom_id]
        shroom_paths = [p for p in shroom_paths if shroom_id not in p]
        # Remove edges referencing this shroom
        edges = new_graph.get("edges", [])
        new_graph["edges"] = [
            e for e in edges
            if e.get("from") != shroom_id and e.get("to") != shroom_id
        ]

    elif change_type == "edit_company":
        new_company.update(payload["updates"])

    elif change_type == "edit_graph_edge":
        from_s = payload["from_shroom"]
        to_s = payload["to_shroom"]
        edge_type = payload["edge_type"]
        edges = new_graph.get("edges", [])
        # Replace or add
        updated = False
        new_edges = []
        for e in edges:
            if e.get("from") == from_s and e.get("to") == to_s:
                new_edges.append({"from": from_s, "to": to_s, "type": edge_type})
                updated = True
            else:
                new_edges.append(e)
        if not updated:
            new_edges.append({"from": from_s, "to": to_s, "type": edge_type})
        new_graph["edges"] = new_edges

    elif change_type == "remove_graph_edge":
        from_s = payload["from_shroom"]
        to_s = payload["to_shroom"]
        edges = new_graph.get("edges", [])
        new_graph["edges"] = [
            e for e in edges
            if not (e.get("from") == from_s and e.get("to") == to_s)
        ]

    new_config = MyceliumConfig(
        company=new_company,
        shrooms=shroom_paths,
        graph=new_graph,
    )
    return new_config, new_manifests


# ---------------------------------------------------------------------------
# YAML serialisation
# ---------------------------------------------------------------------------


def _manifest_to_dict(manifest: ShroomManifest) -> dict:
    spec: dict[str, Any] = {"model": manifest.spec.model}
    if manifest.spec.memory:
        spec["memory"] = manifest.spec.memory
    if manifest.spec.skills:
        spec["skills"] = manifest.spec.skills
    if manifest.spec.can:
        spec["can"] = manifest.spec.can
    if manifest.spec.cannot:
        spec["cannot"] = manifest.spec.cannot
    if manifest.spec.escalates_to:
        spec["escalates_to"] = manifest.spec.escalates_to
    if manifest.spec.sla_response_minutes is not None:
        spec["sla_response_minutes"] = manifest.spec.sla_response_minutes
    if manifest.spec.mcps:
        spec["mcps"] = manifest.spec.mcps
    return {
        "apiVersion": "mycelium.io/v1",
        "kind": "Shroom",
        "metadata": {"id": manifest.metadata.id, "name": manifest.metadata.name},
        "spec": spec,
    }


def _write_yaml_files(
    new_config: MyceliumConfig,
    new_manifests: dict[str, ShroomManifest],
    config_path: Path,
    old_manifests: dict[str, ShroomManifest],
) -> None:
    """Write updated YAML files to disk. Raises ConstitutionWriteError on failure."""
    base_dir = config_path.parent
    try:
        # Write shroom manifests that changed or were added
        for shroom_id, manifest in new_manifests.items():
            old = old_manifests.get(shroom_id)
            if old is None or _manifest_to_dict(old) != _manifest_to_dict(manifest):
                # Determine path from shrooms list in new_config
                rel_path = next(
                    (p for p in new_config.shrooms if shroom_id in p),
                    f"examples/shrooms/{shroom_id}.yaml",
                )
                manifest_path = base_dir / rel_path
                manifest_path.parent.mkdir(parents=True, exist_ok=True)
                manifest_path.write_text(
                    yaml.dump(_manifest_to_dict(manifest), default_flow_style=False, allow_unicode=True)
                )
                logger.info("Wrote manifest: %s", manifest_path)

        # Write updated mycelium.yaml
        config_dict: dict[str, Any] = {
            "company": dict(new_config.company),
            "shrooms": list(new_config.shrooms),
        }
        if new_config.graph:
            config_dict["graph"] = new_config.graph
        config_path.write_text(
            yaml.dump(config_dict, default_flow_style=False, allow_unicode=True)
        )
        logger.info("Wrote mycelium.yaml: %s", config_path)
    except OSError as exc:
        raise ConstitutionWriteError(f"Failed to write YAML files: {exc}") from exc


# ---------------------------------------------------------------------------
# Public service
# ---------------------------------------------------------------------------


class ConstitutionWriterService:
    """Apply approved constitution changes atomically (disk write then DB record)."""

    def __init__(self, config_path: Path, session_factory) -> None:
        self.config_path = config_path
        self.session_factory = session_factory

    def apply_change(
        self,
        approval: Approval,
        applied_by: str,
        controller=None,
        app_state=None,
    ) -> ConstitutionChange:
        """
        Apply the constitution change from *approval* and return the DB record.

        Raises:
            InvalidChangePayload: if the payload is structurally invalid.
            ConstitutionWriteError: if the YAML/disk write fails.
        """
        payload = approval.payload or {}
        validate_change_payload(payload)

        # Load current state from disk (source of truth)
        config = load_mycelium_config(self.config_path)
        base_dir = self.config_path.parent
        manifests: dict[str, ShroomManifest] = {}
        for rel_path in config.shrooms:
            m = load_shroom_manifest(base_dir / rel_path)
            manifests[m.metadata.id] = m

        snapshot_before = _config_to_snapshot(config, manifests)

        new_config, new_manifests = _apply_change_to_state(
            payload, config, manifests, self.config_path
        )

        snapshot_after = _config_to_snapshot(new_config, new_manifests)

        # Step 1: write to disk (git-backed)
        _write_yaml_files(new_config, new_manifests, self.config_path, manifests)

        # Step 2: record in DB
        change_summary = payload.get("change_summary") or _default_summary(payload)
        change_record = ConstitutionChange(
            approval_id=approval.id,
            change_type=payload["change_type"],
            change_summary=change_summary,
            payload=payload,
            constitution_snapshot=snapshot_after,
            applied_by=applied_by,
            applied_at=datetime.now(timezone.utc),
        )

        session = self.session_factory()
        try:
            session.add(change_record)
            session.commit()
            session.refresh(change_record)
        except Exception as exc:
            session.rollback()
            # YAML already written — log but don't fail (git is source of truth)
            logger.error(
                "ConstitutionChange DB write failed after successful YAML write: %s", exc
            )
            session.close()
            raise
        finally:
            session.close()

        # Step 3: reload in-memory state
        if controller is not None:
            _reload_controller(controller, new_config, new_manifests)
        if app_state is not None:
            app_state.mycelium_config = new_config

        logger.info(
            "Constitution change applied: type=%s by=%s",
            payload["change_type"],
            applied_by,
        )
        return change_record

    def list_changes(self, limit: int = 50) -> list[ConstitutionChange]:
        session = self.session_factory()
        try:
            return (
                session.query(ConstitutionChange)
                .order_by(ConstitutionChange.applied_at.desc())
                .limit(limit)
                .all()
            )
        finally:
            session.close()


def _default_summary(payload: dict) -> str:
    ct = payload.get("change_type", "unknown")
    sid = payload.get("shroom_id", "")
    if ct == "add_shroom":
        return f"Add shroom '{sid}'"
    if ct == "edit_shroom":
        return f"Edit shroom '{sid}': {list(payload.get('updates', {}).keys())}"
    if ct == "remove_shroom":
        return f"Remove shroom '{sid}'"
    if ct == "edit_company":
        return f"Edit company: {list(payload.get('updates', {}).keys())}"
    if ct == "edit_graph_edge":
        return f"Set edge {payload.get('from_shroom')} → {payload.get('to_shroom')}: {payload.get('edge_type')}"
    if ct == "remove_graph_edge":
        return f"Remove edge {payload.get('from_shroom')} → {payload.get('to_shroom')}"
    return f"Constitution change: {ct}"


def _reload_controller(controller, new_config: MyceliumConfig, new_manifests: dict[str, ShroomManifest]) -> None:
    """Reload the controller's manifests in-place (best-effort)."""
    from core.controller import create_agent
    try:
        # Remove shrooms that were deleted
        removed = set(controller.manifests.keys()) - set(new_manifests.keys())
        for shroom_id in removed:
            controller.manifests.pop(shroom_id, None)
            controller.agents.pop(shroom_id, None)

        # Add or update shrooms
        for shroom_id, manifest in new_manifests.items():
            if shroom_id not in controller.manifests or controller.manifests[shroom_id] != manifest:
                controller.manifests[shroom_id] = manifest
                controller.agents[shroom_id] = create_agent(manifest, controller.db)
    except Exception as exc:
        logger.error("Failed to reload controller after constitution change: %s", exc)
