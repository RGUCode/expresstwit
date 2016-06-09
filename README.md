# expresstwit :cat:

restart express with 
  forever start -c "npm start" ./
  
  if mongo break horribly again restart with 
  sudo mongod --fork --dbpath /datadrive/mongo/mongodb/ --smallfiles --logpath /datadrive/mongo/log/mongodb.log --logapp
  
