"""Assert that the distributed APK contains byte-identical current app assets."""
from pathlib import Path
import sys, zipfile, hashlib
apk = Path(sys.argv[1])
assets = Path(__file__).resolve().parents[1] / 'app/src/main/assets'
with zipfile.ZipFile(apk) as z:
    for source in assets.iterdir():
        if source.is_file():
            assert z.read('assets/' + source.name) == source.read_bytes(), source.name
    assert b'engine.js' in z.read('assets/index.html')
    assert 'Настройки'.encode() in z.read('assets/app.js')
    assert 'Пифагор'.encode() in z.read('assets/content.js')
print('PASS: every asset in APK matches current source; new UI, engine, settings and Pythagoras included.')
print('SHA256:', hashlib.sha256(apk.read_bytes()).hexdigest())
