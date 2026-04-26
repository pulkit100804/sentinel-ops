import torch
import torch.nn as nn

def inspect_model(model_path):
    print(f"Inspecting {model_path}...")
    try:
        model_data = torch.load(model_path, map_location='cpu', weights_only=False)
        if isinstance(model_data, dict) and 'state_dict' in model_data:
            state_dict = model_data['state_dict']
        elif isinstance(model_data, dict) and 'model_state_dict' in model_data:
            state_dict = model_data['model_state_dict']
        elif isinstance(model_data, dict) and any(k.startswith('inc.') for k in model_data.keys()):
            state_dict = model_data
        elif isinstance(model_data, nn.Module):
            state_dict = model_data.state_dict()
        else:
            state_dict = model_data
        
        if isinstance(state_dict, dict):
            print("State dict keys and shapes:")
            first_layer_key = list(state_dict.keys())[0]
            last_layer_key = list(state_dict.keys())[-1]
            
            print(f"First layer: {first_layer_key}, Shape: {state_dict[first_layer_key].shape}")
            print(f"Last layer: {last_layer_key}, Shape: {state_dict[last_layer_key].shape}")
            
            # Try to find input conv layer
            for k, v in state_dict.items():
                if 'conv' in k.lower() or 'weight' in k.lower():
                    if len(v.shape) == 4:
                        print(f"Found Input Conv layer {k}: {v.shape} -> In Channels = {v.shape[1]}")
                        break
                        
            # Try to find output conv layer
            for k in reversed(list(state_dict.keys())):
                v = state_dict[k]
                if 'conv' in k.lower() or 'weight' in k.lower():
                    if len(v.shape) == 4:
                        print(f"Found Output Conv layer {k}: {v.shape} -> Out Channels = {v.shape[0]}")
                        break
        else:
            print("Loaded object is not a state dictionary. Type:", type(model_data))
    except Exception as e:
        print("Error loading model:", e)

inspect_model('unet_disaster_model(100).pth.zip')
