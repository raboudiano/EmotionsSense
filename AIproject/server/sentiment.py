import sys
import json
from transformers import pipeline
from PIL import Image

def main():
    try:
        if len(sys.argv) < 2:
            raise ValueError("No image path provided.")

        image_path = sys.argv[1]
        print(f"[INFO] Image path received: {image_path}", file=sys.stderr)

        # تحميل الصورة
        image = Image.open(image_path)
        print("[INFO] Image successfully loaded.", file=sys.stderr)

        # تحميل النموذج
        classifier = pipeline('image-classification', model='trpakov/vit-face-expression')
        print("[INFO] Model loaded successfully.", file=sys.stderr)

        # تصنيف الصورة
        result = classifier(image)[0]  # أعلى احتمال
        emotion = result['label'].upper()
        score = result['score']

        print(f"[INFO] Detected emotion: {emotion}, Score: {score}", file=sys.stderr)

        # ربط العواطف بالمشاعر
        sentiment_map = {
            'HAPPY': 'POSITIVE',
            'SURPRISE': 'POSITIVE',
            'SAD': 'NEGATIVE',
            'ANGRY': 'NEGATIVE',
            'FEAR': 'NEGATIVE',
            'DISGUST': 'NEGATIVE',
            'NEUTRAL': 'NEUTRAL'
        }
        sentiment = sentiment_map.get(emotion, 'NEUTRAL')

        # طباعة النتيجة
        print(json.dumps({
            'label': sentiment,
            'emotion': emotion,
            'score': score
        }))

    except Exception as e:
        print(f"[ERROR] {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
