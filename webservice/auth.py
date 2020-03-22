from Crawler import Crawler

import os
os.environ['TZ'] = 'US/Eastern'

import logging
logging.basicConfig(level=logging.DEBUG)

phone = input('phone: ')

crawler = Crawler('session/' + phone)
print(crawler)

# authorized with new crawler object
authorized = crawler.authorized(phone)
