# HuHaHei!

## Setup

One time:
```bash
# open repository root
python3 -m venv ./venv 
```

Each time
```bash
# open repository root
source venv/bin/activate
pip install -r requirements.txt
./manage.py migrate
./manage.py loaddata junction-fixture.json
./manage.py runserver
```
