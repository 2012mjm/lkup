python3 -m site
cd /usr/local/lib/python3.5/site-packages/

# OR

cd /usr/local/lib/python3.4/dist-packages/

# problem bad long time

import os  
os.environ['TZ'] = 'US/Eastern'

######

yum install ntp
chkconfig ntpd on
ntpdate time.apple.com

# oprn port

iptables -A INPUT -m state --state NEW -p tcp --dport 5835 -j ACCEPT

# install requirement

sudo apt install python3-pip
pip3 install requirements

# run in background

nohup python3 ~mjm3d/likeup_bot/webservice/api.py > output.log &
ps ax | grep api.py
kill PID
