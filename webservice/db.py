#!/usr/bin/python3
import mysql.connector
from datetime import datetime, timedelta

database = 'mjm3d_likesup'
user = 'mjm3d_likesup'
password = 'MfW75zO8d'
host = '127.0.0.1'
charset='utf8mb4'
cnx = 1
cur = 1

def connect():
	global cnx, cur
	cnx = mysql.connector.connect(user=user, password=password, host=host, database=database, charset=charset)
	cur = cnx.cursor(dictionary=True, buffered=True)

def findActiveSession():
	connect()
	cur.execute("SELECT * FROM session WHERE active='1' AND (blockDate < %(now)s OR blockDate IS NULL) ORDER BY RAND()", {'now':datetime.now().strftime("%Y-%m-%d %H:%M:%S")})
	res = cur.fetchone()
	cur.close()
	cnx.close()
	return res

def updateBlockDateSession(id, afterDate):
	connect()
	cur.execute("UPDATE session SET blockDate=%(block)s WHERE id=%(id)s;", {'id':id, 'block':afterDate.strftime("%Y-%m-%d %H:%M:%S")})
	cnx.commit()
	cur.close()
	cnx.close()

def inactiveSession(id):
	connect()
	cur.execute("UPDATE session SET active='0' WHERE id=%(id)s;", {'id':id})
	cnx.commit()
	cur.close()
	cnx.close()
