from Crawler import Crawler
from flask import Flask, jsonify, request

app = Flask(__name__)
crawler = None

@app.route("/login", methods=['POST'])
def login():
	phone = request.form.get('phone', None)
	print(phone)

	global crawler
	crawler = Crawler('session/' + phone)
	print(crawler)

	status, result = crawler.authorized_step(phone)
	print(status)
	print(result)
	return jsonify({'status': status, 'result': result})

@app.route("/verify", methods=['POST'])
def verify():
	phone = request.form.get('phone', None)
	code = request.form.get('code', None)
	print(phone)
	print(code)

	global crawler
	status, result = crawler.authorized_verify(phone, code)
	print(status)
	print(result)
	del crawler
	if status is 'ok':
		return jsonify({'status': status, 'result': {'id': result.id, 'first_name': result.first_name, 'username': result.username}})
	else:
		return jsonify({'status': status, 'result': result})

if __name__ == '__main__':
	app.run(debug=True, port=5835, host='0.0.0.0')

