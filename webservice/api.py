#!/usr/bin/python3

# python3 bot.py
# GET http://127.0.0.1:5833/message?session=mahsa&channel_username=chYaab&message_id=987
# POST http://127.0.0.1:5833/bot-callback -> session=mahsa, channel_username=chYaab, message_id=987, callback_data=channel_980_vote_5

# import os
# os.environ['TZ'] = 'US/Eastern'

# import json
from quart import Quart, jsonify, request
from Crawler import Crawler
# import db
# from telethon.tl.functions.messages import GetBotCallbackAnswerRequest
# from telethon.tl.types import MessageMediaDocument, \
#     MessageMediaPhoto, \
#     MessageMediaContact, \
#     MessageMediaGeo, \
#     InputPeerChannel

app = Quart(__name__)


# def getCrawler(sessionName=None, sessionId=None):
#     if sessionName is None:
#         sessionDb = db.findActiveSession()
#         if sessionDb is None:
#             return None, None
#         sessionName = sessionDb['phone']
#         sessionId = sessionDb['id']

#     crawler = Crawler('session/'+sessionName)
#     authorized = crawler.isAuthorized()
#     if authorized is None:
#         del crawler
#         return None, sessionId
#     return crawler, sessionId


# def getInfoChannel(crawler, username, sessionId=None):
#     status, peer, afterDate = crawler.getInfo(username)
#     if status is 'ok':
#         return peer, None
#     elif status in ['valueError', 'timeoutError', 'exception']:
#         del crawler
#         return None, status
#     elif status is 'floodWaitError':
#         del crawler
#         if sessionId is not None:
#             db.updateBlockDateSession(sessionId, afterDate)
#         return None, status+': '+afterDate.strftime("%Y-%m-%d %H:%M:%S")


# @app.route("/message", methods=['GET'])
# def message():
#     print('start message')
#     crawler, sessionId = getCrawler(request.args.get(
#         'session', None), request.args.get('session_id', None, int))
#     if crawler is None:
#         if sessionId is not None:
#             db.inactiveSession(sessionId)
#         return jsonify({'error': 'crawler not found'}), 500

#     peer, error = getInfoChannel(
#         crawler, request.args.get('channel_username'), sessionId)
#     if error is not None:
#         del crawler
#         return jsonify({'error': error}), 500

#     messageCount, messages = crawler.getHistoryChannel(
#         peer.id, peer.access_hash, 1, (request.args.get('message_id', None, int)+1))
#     msg = messages[0]

#     forward = crawler.filterForward(msg.fwd_from)
#     if forward is not None:
#         forward = json.loads(forward)

#     entities = crawler.filterEntities(msg.entities)
#     if entities is not None:
#         entities = json.loads(entities)

#     reply_markup = crawler.filterReplyMarkup(msg.reply_markup)
#     if reply_markup is not None:
#         reply_markup = json.loads(reply_markup)

#     obj = {
#         'id': msg.id,
#         'views': msg.views,
#         'message': msg.message,
#         'media_unread': msg.media_unread,
#         'date': msg.date,
#         'edit_date': msg.edit_date,
#         'via_bot_id': msg.via_bot_id,
#         'from_id': msg.from_id,
#         'grouped_id': msg.grouped_id,
#         'forward': forward,
#         'entities': entities,
#         'post_author': msg.post_author,
#         'reply_markup': reply_markup,
#         'sessionId': sessionId,
#     }

#     if isinstance(msg.media, MessageMediaPhoto):
#         obj.update(crawler.mediaPhoto(msg.media))
#     elif isinstance(msg.media, MessageMediaDocument):
#         obj.update(crawler.mediaDocument(msg.media))
#     elif isinstance(msg.media, MessageMediaContact):
#         obj.update(crawler.mediaContact(msg.media))
#     elif isinstance(msg.media, MessageMediaGeo):
#         obj.update(crawler.mediaGeo(msg.media))

#     del crawler
#     return jsonify(obj), 200


# @app.route("/bot-callback", methods=['POST'])
# def botCallback():
#     crawler, sessionId = getCrawler(request.form.get(
#         'session', None), request.args.get('session_id', None, int))
#     if crawler is None:
#         if sessionId is not None:
#             db.inactiveSession(sessionId)
#         return jsonify({'error': 'crawler not found'}), 500

#     peer, error = getInfoChannel(
#         crawler, request.form.get('channel_username'), sessionId)
#     if error is not None:
#         del crawler
#         return jsonify({'error': error}), 500

#     try:
#         res = crawler.client(GetBotCallbackAnswerRequest(
#             game=False,
#             peer=InputPeerChannel(channel_id=peer.id,
#                                   access_hash=peer.access_hash),
#             msg_id=request.form.get('message_id', None, int),
#             data=bytes(request.form.get('callback_data'), 'utf8')
#         ))
#         return jsonify({'url': res.url, 'alert': res.alert, 'has_url': res.has_url, 'message': res.message, 'cache_time': res.cache_time}), 200
#     except Exception as err:
#         return jsonify({'error': str(err)}), 500


@app.route("/user/login", methods=['POST'])
async def login():
    phone = (await request.form).get('phone')
    print(phone)

    crawler = Crawler()
    await crawler.connect('session/' + phone)
    status, result = await crawler.authorized_step(phone)
    await crawler.disconnect()

    print(status)
    print(result)

    if status is 'already_login':
        return jsonify({'status': status, 'result': {'id': result.id, 'first_name': result.first_name, 'username': result.username}})
    else:
        return jsonify({'status': status, 'result': result})


@app.route("/user/verify", methods=['POST'])
async def verify():
    phone = (await request.form).get('phone')
    code = (await request.form).get('code')
    hash = (await request.form).get('hash')
    firstname = (await request.form).get('firstname')
    lastname = (await request.form).get('lastname')
    bio = (await request.form).get('bio')
    photo = (await request.form).get('photo')

    print(phone, code, hash, firstname, lastname, bio, photo)

    crawler = Crawler()
    await crawler.connect('session/' + phone)

    status, result = await crawler.authorized_verify(phone, code, hash, firstname, lastname, bio, photo)
    await crawler.disconnect()

    print(status)
    print(result)

    if status is 'ok':
        return jsonify({'status': status, 'result': {'id': result.id, 'first_name': result.first_name, 'username': result.username}})
    else:
        return jsonify({'status': status, 'result': result})


if __name__ == '__main__':
    app.run(debug=True, port=5833, host='0.0.0.0')
