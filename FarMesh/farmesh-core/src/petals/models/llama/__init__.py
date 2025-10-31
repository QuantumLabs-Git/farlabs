from farmesh.models.llama.block import WrappedLlamaBlock
from farmesh.models.llama.config import DistributedLlamaConfig
from farmesh.models.llama.model import (
    DistributedLlamaForCausalLM,
    DistributedLlamaForSequenceClassification,
    DistributedLlamaModel,
)
from farmesh.models.llama.speculative_model import DistributedLlamaForSpeculativeGeneration
from farmesh.utils.auto_config import register_model_classes

register_model_classes(
    config=DistributedLlamaConfig,
    model=DistributedLlamaModel,
    model_for_causal_lm=DistributedLlamaForCausalLM,
    model_for_speculative=DistributedLlamaForSpeculativeGeneration,
    model_for_sequence_classification=DistributedLlamaForSequenceClassification,
)
