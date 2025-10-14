import os
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
  sys.path.insert(0, str(ROOT))

from farlabs_gpu_worker.config import WorkerSettings  # noqa: E402


class WorkerSettingsTest(unittest.TestCase):
  def setUp(self) -> None:
    self._env_backup = os.environ.copy()

  def tearDown(self) -> None:
    os.environ.clear()
    os.environ.update(self._env_backup)

  def test_registration_requires_gpu_details(self) -> None:
    os.environ.pop("FARLABS_NODE_ID", None)
    os.environ["FARLABS_API_TOKEN"] = "demo-token-value"
    os.environ["FARLABS_WALLET_ADDRESS"] = "0xabcdef1234567890"

    with self.assertRaises(ValueError):
      WorkerSettings.from_env(dotenv=False)

  def test_node_id_skips_registration_requirements(self) -> None:
    os.environ["FARLABS_API_TOKEN"] = "demo-token-value"
    os.environ["FARLABS_WALLET_ADDRESS"] = "0xabcdef1234567890"
    os.environ["FARLABS_NODE_ID"] = "node_123"

    settings = WorkerSettings.from_env(dotenv=False)
    self.assertEqual(settings.node_id, "node_123")

  def test_registration_fields_cast(self) -> None:
    os.environ["FARLABS_API_TOKEN"] = "demo-token-value"
    os.environ["FARLABS_WALLET_ADDRESS"] = "0xabcdef1234567890"
    os.environ.pop("FARLABS_NODE_ID", None)
    os.environ["FARLABS_GPU_MODEL"] = "RTX 4090"
    os.environ["FARLABS_VRAM_GB"] = "24"
    os.environ["FARLABS_BANDWIDTH_GBPS"] = "12.5"

    settings = WorkerSettings.from_env(dotenv=False)
    self.assertEqual(settings.gpu_model, "RTX 4090")
    self.assertEqual(settings.vram_gb, 24)
    self.assertAlmostEqual(settings.bandwidth_gbps, 12.5)
    self.assertIn("llama-70b", settings.executor_model_map)

  def test_custom_model_map_merges_defaults(self) -> None:
    os.environ["FARLABS_API_TOKEN"] = "demo-token-value"
    os.environ["FARLABS_WALLET_ADDRESS"] = "0xabcdef1234567890"
    os.environ.pop("FARLABS_NODE_ID", None)
    os.environ["FARLABS_GPU_MODEL"] = "RTX 4090"
    os.environ["FARLABS_VRAM_GB"] = "24"
    os.environ["FARLABS_EXECUTOR_MODEL_MAP"] = '{"custom-model": "org/model"}'

    settings = WorkerSettings.from_env(dotenv=False)
    self.assertIn("custom-model", settings.executor_model_map)
    # Defaults are preserved alongside custom entries
    self.assertIn("llama-70b", settings.executor_model_map)

  def test_invalid_model_map_raises(self) -> None:
    os.environ["FARLABS_API_TOKEN"] = "demo-token-value"
    os.environ["FARLABS_WALLET_ADDRESS"] = "0xabcdef1234567890"
    os.environ.pop("FARLABS_NODE_ID", None)
    os.environ["FARLABS_GPU_MODEL"] = "RTX 4090"
    os.environ["FARLABS_VRAM_GB"] = "24"
    os.environ["FARLABS_EXECUTOR_MODEL_MAP"] = "not-json"

    with self.assertRaises(ValueError):
      WorkerSettings.from_env(dotenv=False)

  def test_refresh_config_parsing(self) -> None:
    os.environ["FARLABS_API_TOKEN"] = "demo-token-value"
    os.environ["FARLABS_WALLET_ADDRESS"] = "0xabcdef1234567890"
    os.environ["FARLABS_NODE_ID"] = "node_abc"
    os.environ["FARLABS_AUTH_REFRESH_ENABLED"] = "true"
    os.environ["FARLABS_AUTH_REFRESH_ENDPOINT"] = "/api/auth/login"
    os.environ["FARLABS_AUTH_REFRESH_LEEWAY_SECONDS"] = "120"

    settings = WorkerSettings.from_env(dotenv=False)
    self.assertTrue(settings.auth_refresh_enabled)
    self.assertEqual(settings.auth_refresh_endpoint, "/api/auth/login")
    self.assertEqual(settings.auth_refresh_leeway_seconds, 120)
    self.assertEqual(settings.auth_wallet_address, "0xabcdef1234567890")


if __name__ == "__main__":
  unittest.main()
