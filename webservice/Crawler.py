import os
import hashlib
import json
import socks
import urllib.request
import random
from datetime import datetime, timedelta

# from IPython import embed

from telethon import TelegramClient

from telethon.tl.functions.messages import GetHistoryRequest
from telethon.tl.functions.contacts import ResolveUsernameRequest
from telethon.tl.functions.channels import GetFullChannelRequest
from telethon.tl.functions.upload import GetFileRequest
from telethon.tl.functions.account import UpdateProfileRequest
from telethon.tl.functions.photos import UploadProfilePhotoRequest
from telethon.tl.functions.channels import JoinChannelRequest

from telethon.errors import FloodWaitError, \
    SessionPasswordNeededError, \
    PhoneNumberUnoccupiedError, \
    FilePartsInvalidError,\
    ImageProcessFailedError,\
    PhotoCropSizeSmallError,\
    PhotoExtInvalidError, \
    AuthRestartError, \
    InputRequestTooLongError, \
    PhoneNumberAppSignupForbiddenError, \
    PhoneNumberBannedError, \
    PhoneNumberInvalidError, \
    ApiIdInvalidError, \
    ApiIdPublishedFloodError, \
    ChannelsTooMuchError, \
    ChannelInvalidError, \
    ChannelPrivateError


from telethon.tl.types import InputChannel, \
    InputPeerChannel, \
    Message, \
    MessageMediaDocument, \
    InputDocumentFileLocation, \
    MessageMediaPhoto, \
    MessageMediaContact, \
    MessageMediaGeo, \
    MessageMediaWebPage, \
    DocumentAttributeImageSize, \
    DocumentAttributeAnimated, \
    DocumentAttributeSticker, \
    DocumentAttributeVideo, \
    DocumentAttributeAudio, \
    DocumentAttributeFilename, \
    DocumentAttributeHasStickers, \
    MessageEntityUnknown, \
    MessageEntityMention, \
    MessageEntityHashtag, \
    MessageEntityBotCommand, \
    MessageEntityUrl, \
    MessageEntityEmail, \
    MessageEntityBold, \
    MessageEntityItalic, \
    MessageEntityCode, \
    MessageEntityPre, \
    MessageEntityTextUrl, \
    MessageEntityMentionName, \
    KeyboardButtonUrl, \
    KeyboardButtonCallback, \
    KeyboardButton, \
    KeyboardButtonRequestPhone, \
    KeyboardButtonRequestGeoLocation, \
    KeyboardButtonSwitchInline, \
    KeyboardButtonGame, \
    KeyboardButtonBuy


class Crawler:
    client = None

    def __del__(self):
        if self.client:
            self.client.disconnect()

    async def connect(self, storage_name, api_id=78380, api_hash='4e9377bdd268a8303ebb0102fd025cd4'):
        self.client = TelegramClient(
            storage_name, api_id, api_hash, proxy=(socks.SOCKS5, '127.0.0.1', 1080))

        out = await self.client.connect()
        print('client connect status', out)
        return out

    async def disconnect(self):
        if self.client:
            await self.client.disconnect()

    async def authorized_step(self, phone=None):

        if self.client is None:
            return 'client_none', None

        if not await self.client.is_user_authorized():
            try:
                result = await self.client.send_code_request(phone)
                return 'send_code', result.phone_code_hash
            except FloodWaitError as err:
                afterDate = datetime.now() + timedelta(seconds=err.seconds)
                return 'floodWaitError', afterDate.strftime("%Y-%m-%d %H:%M:%S")
            except ApiIdInvalidError as err:
                return 'ApiIdInvalidError, The api_id/api_hash combination is invalid.', None
            except ApiIdPublishedFloodError as err:
                return 'ApiIdPublishedFloodError, This API id was published somewhere, you cant use it now', None
            except AuthRestartError as err:
                return 'AuthRestartError: Restart the authorization process', None
            except InputRequestTooLongError as err:
                return 'InputRequestTooLongError: The input request was too long. This may be a bug in the library as it can occur when serializing more bytes than it should (like appending the vector constructor code at the end of a message)', None
            except PhoneNumberAppSignupForbiddenError as err:
                return 'PhoneNumberAppSignupForbiddenError', None
            except PhoneNumberBannedError as err:
                return 'PhoneNumberBannedError, The used phone number has been banned from Telegram and cannot be used anymore. Maybe check https://www.telegram.org/faq_spam', None
            except PhoneNumberInvalidError as err:
                return 'PhoneNumberInvalidError, The phone number is invalid', None
            except Exception as err:
                return 'exception', None

        return 'already_login', await self.client.get_me()

    async def authorized_verify(self, phone=None, code=None, hash=None, firstname=None, lastname=None, bio=None, photo=None):
        if self.client is None:
            return 'client_none', None
        if not await self.client.is_user_authorized():
            try:
                await self.client.sign_in(phone, code, phone_code_hash=hash)
            except PhoneNumberUnoccupiedError as err:
                await self.client.sign_up(code, firstname)
            # except SessionPasswordNeeded as err:
            #     return 'password_needed', None
            except FloodWaitError as err:
                afterDate = datetime.now() + timedelta(seconds=err.seconds)
                return 'floodWaitError', afterDate.strftime("%Y-%m-%d %H:%M:%S")
            except Exception as err:
                print(err)
                return 'exception', None

            try:
                await self.client(UpdateProfileRequest(
                    first_name=firstname,
                    last_name=lastname,
                    about=bio
                ))
            except Exception as err:
                print(err)
                return 'exception', None

            try:
                photoPath = await self.downloadImageFromUrl(photo)
                print('photoPath', photoPath)

                uploadPhoto = await self.client.upload_file(photoPath)
                await self.client(UploadProfilePhotoRequest(
                    file=uploadPhoto
                ))
                # await self.removeImage(photoPath)
            except FilePartsInvalidError as err:
                print('FilePartsInvalidError')
                return 'FilePartsInvalidError', None
            except ImageProcessFailedError as err:
                print('ImageProcessFailedError')
                return 'ImageProcessFailedError', None
            except PhotoCropSizeSmallError as err:
                print('PhotoCropSizeSmallError')
                return 'PhotoCropSizeSmallError', None
            except PhotoExtInvalidError as err:
                print('PhotoExtInvalidError')
                return 'PhotoExtInvalidError', None
            except Exception as err:
                print(err)
                return 'exception', None

            return 'ok', await self.client.get_me()
        return 'already_login', None

    async def downloadImageFromUrl(self, url):
        name = random.randrange(1000000, 9999999)
        fullname = os.getcwd()+"/photos/"+str(name)+".jpg"

        urllib.request.urlretrieve(
            url, fullname)
        return fullname

    async def removeImage(self, path):
        return os.remove(path)

    def isAuthorized(self, phone=None):
        if self.client is None:
            return None

        if not self.client.is_user_authorized():
            return None
        return 1

    def getInfo(self, username):
        print('ResolveUsername:', username)
        try:
            result = self.client(ResolveUsernameRequest(username=username))
        except FloodWaitError as err:
            afterDate = datetime.now() + timedelta(seconds=err.seconds)
            print('flood:', afterDate.strftime("%Y-%m-%d %H:%M:%S"))
            return 'floodWaitError', None, afterDate
        except ValueError as err:
            print(err)
            return 'valueError', None, None
        except TimeoutError as err:
            print(err)
            return 'timeoutError', None, None
        except Exception as err:
            print(err)
            return 'exception', None, None

        return 'ok', result.chats[0], None

    def getFulChannel(self, id, access_hash):
        print('GetFullChannel:', id, access_hash)
        result = self.client(GetFullChannelRequest(
            channel=InputChannel(id, access_hash)))
        return result.full_chat

    def getHistoryChannel(self, id, access_hash, limit=1, offset_id=0):
        print('GetHistory:', id, access_hash, limit, offset_id)
        messages = []
        result = self.client(GetHistoryRequest(
            peer=InputPeerChannel(id, access_hash),
            limit=limit,
            offset_date=None,
            offset_id=offset_id,
            max_id=0,
            min_id=0,
            add_offset=0
        ))

        for message in result.messages:
            if isinstance(message, Message):
                messages.append(message)

        return result.count, messages

    def downloadAndMd5(self, media):
        where = self.client.download_media(media, "data")
        md5 = hashlib.md5(open(where, 'rb').read()).hexdigest()
        os.remove(where)
        return md5

    def filterForward(self, forward):
        if forward is None:
            return None
        forwards = {}
        if forward.channel_id is not None:
            forwards.update({'channel_id': forward.channel_id})
        if forward.channel_post is not None:
            forwards.update({'channel_post': forward.channel_post})
        if forward.from_id is not None:
            forwards.update({'from_id': forward.from_id})
        return json.dumps(forwards)

    def filterEntity(self, entity):
        if isinstance(entity, MessageEntityUnknown):
            return json.dumps({'type': 'unknown', 'offset': entity.offset, 'length': entity.length})
        elif isinstance(entity, MessageEntityMention):
            return json.dumps({'type': 'mention', 'offset': entity.offset, 'length': entity.length})
        elif isinstance(entity, MessageEntityHashtag):
            return json.dumps({'type': 'hashtag', 'offset': entity.offset, 'length': entity.length})
        elif isinstance(entity, MessageEntityBotCommand):
            return json.dumps({'type': 'botCommand', 'offset': entity.offset, 'length': entity.length})
        elif isinstance(entity, MessageEntityUrl):
            return json.dumps({'type': 'url', 'offset': entity.offset, 'length': entity.length})
        elif isinstance(entity, MessageEntityEmail):
            return json.dumps({'type': 'email', 'offset': entity.offset, 'length': entity.length})
        elif isinstance(entity, MessageEntityBold):
            return json.dumps({'type': 'bold', 'offset': entity.offset, 'length': entity.length})
        elif isinstance(entity, MessageEntityItalic):
            return json.dumps({'type': 'italic', 'offset': entity.offset, 'length': entity.length})
        elif isinstance(entity, MessageEntityCode):
            return json.dumps({'type': 'code', 'offset': entity.offset, 'length': entity.length})
        elif isinstance(entity, MessageEntityPre):
            return json.dumps({'type': 'pre', 'offset': entity.offset, 'length': entity.length, 'language': entity.language})
        elif isinstance(entity, MessageEntityTextUrl):
            return json.dumps({'type': 'textUrl', 'offset': entity.offset, 'length': entity.length, 'url': entity.url})
        elif isinstance(entity, MessageEntityMentionName):
            return json.dumps({'type': 'mentionName', 'offset': entity.offset, 'length': entity.length, 'user_id': entity.user_id})
        else:
            return None

    def filterEntities(self, entities):
        if entities is None:
            return None
        entityList = []
        for entity in entities:
            entityList.append(json.loads(self.filterEntity(entity)))
        return json.dumps(entityList)

    def documentAttribute(self, attribute):
        if isinstance(attribute, DocumentAttributeImageSize):
            return json.dumps({'type': 'imageSize', 'w': attribute.w, 'h': attribute.h})
        elif isinstance(attribute, DocumentAttributeAnimated):
            return json.dumps({'type': 'animated'})
        elif isinstance(attribute, DocumentAttributeSticker):
            return json.dumps({'type': 'sticker'})
        elif isinstance(attribute, DocumentAttributeVideo):
            return json.dumps({'type': 'video', 'duration': attribute.duration, 'w': attribute.w, 'h': attribute.h})
        elif isinstance(attribute, DocumentAttributeAudio):
            return json.dumps({'type': 'audio', 'voice': attribute.voice, 'duration': attribute.duration, 'title': attribute.title, 'performer': attribute.performer})
        elif isinstance(attribute, DocumentAttributeFilename):
            return json.dumps({'type': 'filename', 'file_name': attribute.file_name})
        elif isinstance(attribute, DocumentAttributeHasStickers):
            return json.dumps({'type': 'hasStickers'})
        else:
            return None

    def mediaPhoto(self, media, getDownload=False):
        photoSize = media.photo.sizes[-1]
        location = json.dumps({'volume_id': photoSize.location.volume_id,
                               'local_id': photoSize.location.local_id, 'secret': photoSize.location.secret})
        if getDownload:
            md5 = self.downloadAndMd5(media)
        else:
            md5 = None
        if media.photo.has_stickers is True:
            has_stickers = 1
        elif media.photo.has_stickers is None:
            has_stickers = 0
        else:
            has_stickers = 0
        return {'size': photoSize.size, 'w': photoSize.w, 'h': photoSize.h, 'caption': media.caption, 'has_stickers': has_stickers, 'location': location, 'md5': md5}

    def mediaDocument(self, media, getDownload=False):
        location = json.dumps(
            {'id': media.document.id, 'access_hash': media.document.access_hash, 'version': media.document.version})

        attributes = []
        for attribute in media.document.attributes:
            attributes.append(json.loads(self.documentAttribute(attribute)))

        md5 = None
        if getDownload and media.document.size <= 52428800:  # 50 MB
            md5 = self.downloadAndMd5(media)

        return {'size': media.document.size, 'attributes': json.dumps(attributes), 'mime_type': media.document.mime_type, 'caption': media.caption, 'location': location, 'md5': md5}

    def mediaContact(self, media):
        return {'phone_number': media.phone_number, 'first_name': media.first_name, 'last_name': media.last_name, 'contact_user_id': media.user_id}

    def mediaGeo(self, media):
        return {'lat': media.geo.lat, 'long': media.geo.long}

    def filterReplyMarkup(self, replyMarkup):
        if replyMarkup is None:
            return None
        rowList = []
        for row in replyMarkup.rows:
            buttonList = []
            for button in row.buttons:
                if isinstance(button, KeyboardButtonCallback):
                    buttonList.append(
                        {'_': 'keyboardButtonCallback', 'text': button.text, 'callback_data': button.data.decode("utf-8")})
                elif isinstance(button, KeyboardButtonUrl):
                    buttonList.append(
                        {'_': 'keyboardButtonUrl', 'text': button.text, 'url': button.url})
                elif isinstance(button, KeyboardButton):
                    buttonList.append(
                        {'_': 'keyboardButton', 'text': button.text})
                elif isinstance(button, KeyboardButtonRequestPhone):
                    buttonList.append(
                        {'_': 'keyboardButtonRequestPhone', 'text': button.text})
                elif isinstance(button, KeyboardButtonRequestGeoLocation):
                    buttonList.append(
                        {'_': 'keyboardButtonRequestGeoLocation', 'text': button.text})
                elif isinstance(button, KeyboardButtonSwitchInline):
                    buttonList.append({'_': 'keyboardButtonSwitchInline',
                                       'same_peer': button.same_peer, 'text': button.text, 'query': button.query})
                elif isinstance(button, KeyboardButtonGame):
                    buttonList.append(
                        {'_': 'keyboardButtonGame', 'text': button.text})
                elif isinstance(button, KeyboardButtonBuy):
                    buttonList.append(
                        {'_': 'keyboardButtonBuy', 'text': button.text})
            rowList.append(buttonList)
        return json.dumps(rowList)

    async def join_channel(self, username=None):
        if self.client is None:
            return 'client_none', None

        if not await self.client.is_user_authorized():
            return 'user not login'

        try:
            result = await self.client(JoinChannelRequest(
                channel=username
            ))
            return 'ok', result
        except ChannelsTooMuchError as err:
            return 'ChannelsTooMuchError', 'You have joined too many channels/supergroups.',
        except ChannelInvalidError as err:
            return 'ChannelInvalidError', 'Invalid channel object. Make sure to pass the right types, for instance making sure that the request is designed for channels or otherwise look for a different one more suited.'
        except ChannelPrivateError as err:
            return 'ChannelPrivateError', 'The channel specified is private and you lack permission to access it. Another reason may be that you were banned from it.'
        except Exception as err:
            print(err)
            return 'exception', None
