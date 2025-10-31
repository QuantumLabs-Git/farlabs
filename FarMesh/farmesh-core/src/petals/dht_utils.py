import warnings

warnings.warn(
    "farmesh.dht_utils has been moved to farmesh.utils.dht. This alias will be removed in FarMesh 2.2.0+",
    DeprecationWarning,
    stacklevel=2,
)

from farmesh.utils.dht import *
