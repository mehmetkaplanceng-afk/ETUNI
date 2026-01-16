import mediapipe as mp
import cv2
import sys

print(f"Python version: {sys.version}")
print(f"MediaPipe version: {mp.__version__}")
print(f"OpenCV version: {cv2.__version__}")

try:
    from mediapipe.python import solutions
    print("Successfully imported mediapipe.python.solutions directly.")
    mp_hands = solutions.hands
    print("MediaPipe Hands solution successfully accessible via direct import.")
except Exception as e:
    print(f"Failed to import mediapipe.python.solutions: {e}")

try:
    import mediapipe.tasks.python as tasks
    print("Successfully imported mediapipe.tasks.python.")
except Exception as e:
    print(f"Failed to import mediapipe.tasks.python: {e}")

try:
    mp_hands = mp.solutions.hands
    print("MediaPipe Hands solution successfully imported via mp.solutions.")
except AttributeError:
    print("mp.solutions is missing (expected on some newer builds/Python versions).")
except Exception as e:
    print(f"Failed to access mp.solutions: {e}")

