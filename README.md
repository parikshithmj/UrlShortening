# UrlShortening
UrlShortener service

• cloud scale Bitly-Like Service on Amazon Cloud and Heroku using Message bus architecture and load balance the requests.   
• Shortening URL implemented in Node.js using CRC32 hashing and leveraged RabbitMq for messaging and Redis Cache for faster fetch. 
• Managed the statistics of the short URL’s persisted in Mongo DB and built REST API to access the statistics in the Trend Server. 
