from farmesh.models.mixtral.block import WrappedMixtralBlock
from farmesh.models.mixtral.config import DistributedMixtralConfig
from farmesh.models.mixtral.model import (
    DistributedMixtralForCausalLM,
    DistributedMixtralForSequenceClassification,
    DistributedMixtralModel,
)
from farmesh.utils.auto_config import register_model_classes

register_model_classes(
    config=DistributedMixtralConfig,
    model=DistributedMixtralModel,
    model_for_causal_lm=DistributedMixtralForCausalLM,
    model_for_sequence_classification=DistributedMixtralForSequenceClassification,
)
