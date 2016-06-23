# expresstwit :cat:

restart express with
  forever start -c "npm start" ./

  if mongo break horribly again restart with
  sudo mongod --fork --dbpath /datadrive/mongo/mongodb/ --smallfiles --logpath /datadrive/mongo/log/mongodb.log --logapp

you will need to have mongodb setup with one document in tweets db, eutweets collection.
see the tweets.eucounts.json file for document structure