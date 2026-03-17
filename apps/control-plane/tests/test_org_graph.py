from __future__ import annotations

from types import SimpleNamespace

from fastapi.testclient import TestClient

from core.controller import ShroomController
from core.manifest import MyceliumConfig, ShroomManifest, ShroomMetadata, ShroomSpec
from main import create_app


def _make_manifest(shroom_id: str, name: str) -> ShroomManifest:
  return ShroomManifest(
    apiVersion="mycelium.io/v1",
    kind="Shroom",
    metadata=ShroomMetadata(id=shroom_id, name=name),
    spec=ShroomSpec(model="mistral-7b"),
  )


def _setup_app_for_org_graph() -> TestClient:
  test_app = create_app()

  controller = ShroomController()
  controller.register(_make_manifest("sales-shroom", "Sales"))
  controller.register(_make_manifest("root-shroom", "CEO"))

  config = MyceliumConfig(
    company={"name": "Acme AI Co", "instance": "dev"},
    shrooms=[],
    graph={"edges": [{"from": "sales-shroom", "to": "root-shroom", "type": "reports-to"}]},
  )

  test_app.state.controller = controller
  test_app.state.mycelium_config = config
  test_app.state.db_session_factory = lambda: SimpleNamespace()
  test_app.state.nats_bus = SimpleNamespace()

  return TestClient(test_app, raise_server_exceptions=False)


def test_org_graph_returns_nodes_and_edges():
  client = _setup_app_for_org_graph()

  resp = client.get("/org/graph")
  assert resp.status_code == 200

  data = resp.json()
  assert "graph" in data
  graph = data["graph"]

  node_ids = {n["id"] for n in graph["nodes"]}
  assert node_ids == {"sales-shroom", "root-shroom"}

  edges = graph["edges"]
  assert edges == [
    {"from": "sales-shroom", "to": "root-shroom", "type": "reports-to", "metadata": {}},
  ]


def test_org_graph_includes_activity_when_requested():
  client = _setup_app_for_org_graph()

  resp = client.get("/org/graph?include_activity=true")
  assert resp.status_code == 200

  data = resp.json()
  assert "activity" in data
  activity = {a["shroom_id"]: a for a in data["activity"]}
  assert set(activity.keys()) == {"sales-shroom", "root-shroom"}

  state = activity["sales-shroom"]
  assert state["status"] in {"idle", "busy", "waiting", "error"}
  assert state["metrics_window"]["window_seconds"] > 0


def test_org_graph_excludes_activity_when_disabled():
  client = _setup_app_for_org_graph()

  resp = client.get("/org/graph?include_activity=false")
  assert resp.status_code == 200

  data = resp.json()
  assert "activity" in data
  assert data["activity"] == []


def test_org_shroom_detail_returns_node_and_edges():
  client = _setup_app_for_org_graph()

  resp = client.get("/org/shrooms/sales-shroom")
  assert resp.status_code == 200

  data = resp.json()
  assert data["node"]["id"] == "sales-shroom"
  assert data["incoming_edges"] == []
  assert data["outgoing_edges"] == [
    {"from": "sales-shroom", "to": "root-shroom", "type": "reports-to", "metadata": {}},
  ]


def test_org_shroom_detail_returns_404_for_unknown_shroom():
  client = _setup_app_for_org_graph()

  resp = client.get("/org/shrooms/does-not-exist")
  assert resp.status_code == 404
  body = resp.json()
  assert "detail" in body


def test_org_graph_paths_returns_simple_path():
  client = _setup_app_for_org_graph()

  resp = client.get("/org/graph/paths?from=sales-shroom&to=root-shroom")
  assert resp.status_code == 200

  data = resp.json()
  paths = data["paths"]
  assert len(paths) == 1
  path = paths[0]
  assert path["nodes"] == ["sales-shroom", "root-shroom"]
  assert path["edges"] == [
    {"from": "sales-shroom", "to": "root-shroom", "type": "reports-to", "metadata": {}},
  ]


def test_org_graph_paths_returns_self_path_single_node():
  client = _setup_app_for_org_graph()

  resp = client.get("/org/graph/paths?from=sales-shroom&to=sales-shroom")
  assert resp.status_code == 200

  data = resp.json()
  paths = data["paths"]
  assert len(paths) == 1
  path = paths[0]
  assert path["nodes"] == ["sales-shroom"]
  assert path["edges"] == []


def test_org_graph_paths_returns_empty_when_no_path_between_distinct_nodes():
  client = _setup_app_for_org_graph()

  resp = client.get("/org/graph/paths?from=root-shroom&to=sales-shroom")
  assert resp.status_code == 200

  data = resp.json()
  assert data["paths"] == []


def test_org_graph_paths_respects_edge_types_filter():
  client = _setup_app_for_org_graph()

  resp = client.get("/org/graph/paths?from=sales-shroom&to=root-shroom")
  assert resp.status_code == 200
  data = resp.json()
  assert len(data["paths"]) == 1

  resp_filtered = client.get(
    "/org/graph/paths?from=sales-shroom&to=root-shroom&edge_types=monitors",
  )
  assert resp_filtered.status_code == 200
  data_filtered = resp_filtered.json()
  assert data_filtered["paths"] == []


def test_org_graph_paths_respects_max_length_limit():
  client = _setup_app_for_org_graph()

  resp = client.get("/org/graph/paths?from=sales-shroom&to=root-shroom&max_length=1")
  assert resp.status_code == 200
  data = resp.json()
  assert len(data["paths"]) == 1

  resp_invalid = client.get(
    "/org/graph/paths?from=sales-shroom&to=root-shroom&max_length=0",
  )
  assert resp_invalid.status_code == 422

