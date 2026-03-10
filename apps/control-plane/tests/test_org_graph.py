from __future__ import annotations

from types import SimpleNamespace

from fastapi.testclient import TestClient

from core.controller import ShroomController
from core.manifest import MyceliumConfig, ShroomManifest, ShroomMetadata, ShroomSpec
from main import app


def _make_manifest(shroom_id: str, name: str) -> ShroomManifest:
  return ShroomManifest(
    apiVersion="mycelium.io/v1",
    kind="Shroom",
    metadata=ShroomMetadata(id=shroom_id, name=name),
    spec=ShroomSpec(model="mistral-7b"),
  )


def _setup_app_for_org_graph() -> TestClient:
  controller = ShroomController()
  controller.register(_make_manifest("sales-shroom", "Sales"))
  controller.register(_make_manifest("ceo-shroom", "CEO"))

  config = MyceliumConfig(
    company={"name": "Acme AI Co", "instance": "dev"},
    shrooms=[],
    graph={"edges": [{"from": "sales-shroom", "to": "ceo-shroom", "type": "reports-to"}]},
  )

  app.state.controller = controller
  app.state.mycelium_config = config
  app.state.db_session_factory = lambda: SimpleNamespace()
  app.state.nats_bus = SimpleNamespace()

  return TestClient(app, raise_server_exceptions=False)


def test_org_graph_returns_nodes_and_edges():
  client = _setup_app_for_org_graph()

  resp = client.get("/org/graph")
  assert resp.status_code == 200

  data = resp.json()
  assert "graph" in data
  graph = data["graph"]

  node_ids = {n["id"] for n in graph["nodes"]}
  assert node_ids == {"sales-shroom", "ceo-shroom"}

  edges = graph["edges"]
  assert edges == [
    {"from": "sales-shroom", "to": "ceo-shroom", "type": "reports-to", "metadata": {}},
  ]


def test_org_graph_includes_activity_when_requested():
  client = _setup_app_for_org_graph()

  resp = client.get("/org/graph?include_activity=true")
  assert resp.status_code == 200

  data = resp.json()
  assert "activity" in data
  activity = {a["shroom_id"]: a for a in data["activity"]}
  assert set(activity.keys()) == {"sales-shroom", "ceo-shroom"}

  state = activity["sales-shroom"]
  assert state["status"] in {"idle", "busy", "waiting", "error"}
  assert state["metrics_window"]["window_seconds"] > 0


def test_org_shroom_detail_returns_node_and_edges():
  client = _setup_app_for_org_graph()

  resp = client.get("/org/shrooms/sales-shroom")
  assert resp.status_code == 200

  data = resp.json()
  assert data["node"]["id"] == "sales-shroom"
  assert data["incoming_edges"] == []
  assert data["outgoing_edges"] == [
    {"from": "sales-shroom", "to": "ceo-shroom", "type": "reports-to", "metadata": {}},
  ]


def test_org_graph_paths_returns_simple_path():
  client = _setup_app_for_org_graph()

  resp = client.get("/org/graph/paths?from=sales-shroom&to=ceo-shroom")
  assert resp.status_code == 200

  data = resp.json()
  paths = data["paths"]
  assert len(paths) == 1
  path = paths[0]
  assert path["nodes"] == ["sales-shroom", "ceo-shroom"]
  assert path["edges"] == [
    {"from": "sales-shroom", "to": "ceo-shroom", "type": "reports-to", "metadata": {}},
  ]

