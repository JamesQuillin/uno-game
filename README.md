# Online Uno Card Game

This application that lets you play Uno with anyone else on any internet-connected device just by going to the website. It is built with NodeJS and Socket.io and deployed on a Linux VPS. You can try it out live at its website [here](http://143.198.106.140/).

To play, all you need to do is decide on a group name and then each player can choose whatever username they want from there and that’s it.

The reason I wanted to make this in the first place was because I have always had fun at family gatherings playing card games and board games like Uno, but with the pandemic going on we haven’t seen eachother nearly as much, and so making this would allow any of us to play with anyone else, especially over something like Zoom or even a phone call.

## Running the Application

To run the application, start by cloning the code and then run:

`npm install`

to install the dependencies. From there, edit `server.js` and update it to whatever port you want it to be served on. It's currently set to port 80, as my deployed site is just serving it over HTTP, as there is no sensitive information being saved or sent anywhere and it is mostly a demo. Once you are done with that just run:

`node server.js`

and the site will be live at whatever port you specified.
