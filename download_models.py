import urllib.request
import os

MODELS = {
    "hand_landmarker.task": "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
    "face_landmarker.task": "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
}

def download_models():
    for name, url in MODELS.items():
        if not os.path.exists(name):
            print(f"Downloading {name}...")
            try:
                urllib.request.urlretrieve(url, name)
                print(f"Downloaded {name}")
            except Exception as e:
                print(f"Error downloading {name}: {e}")
        else:
            print(f"{name} already exists.")

if __name__ == "__main__":
    download_models()
