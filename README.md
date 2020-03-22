# ------------ FOR MIGRATION --------------------

# npm install global package
npm install -g grunt-cli
npm install -g db-migrate-mysql

# create migration
grunt db:migrate:create --name=init --force --sql-file

# run migration
grunt db:migrate:up


# ------------ FOR GENERATE AUTO MODEL --------------------

# npm install global package
npm install -g sails-generate-models

# generate all
sails-generate-models --connection=someMysqlServer

# generate just x table
sails-generate-models --connection=someMysqlServer --table=user


# ------------like DIE in php --------------------
process.exit();

# ------------ UPGRADE ---------------------------
mysql_upgrade -u root -p --force

# ------------- LOCAL JS ----------------------
add empty file: config/local.js
