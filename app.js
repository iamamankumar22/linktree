var express  = require('express');
var app = express();
var mongoose = require('mongoose');
var bodyParser = require("body-parser");
var User = require("./models/user");
var auth = require("./middleware/auth");
var passport = require('passport');
var LocalStrategy  = require('passport-local');
var passportLocalMongoose  = require('passport-local-mongoose');
var bcrypt= require('bcrypt-nodejs');
const { use } = require('passport');
const jwt = require("jsonwebtoken");
var cors = require('cors')
/*********************************************************************************************************************************************************** */
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
//database connection
mongoose.connect("mongodb+srv://amankumar:mongopass@cluster0.hhmjr.mongodb.net/database?retryWrites=true&w=majority",{ useNewUrlParser: true, useUnifiedTopology: true});
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(cors());


/*********************************************************************************************************************************************************** */
// app.use(passport.initialize());
// app.use(passport.session());

// passport.use(new LocalStrategy(User.authenticate()));
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
/*********************************************************************************************************************************************************** */


app.post("/user/signup",cors(), async(req, res) => {
  const user = new User(req.body)
  try{
    await user.save()
    const token = await user.generateauthtoken()
    res.status(201).json({user, token})
  } catch(e){
    res.status(400).send("Username already exists");
  }
});


app.post("/user/login",cors(), async(req, res)=> {
  try{
    const user = await User.findbycredentials(req.body.username, req.body.password);
    const token = await user.generateauthtoken()
    res.status(200).send({user, token}); 

  } catch(e){
    res.status(400).send("Wrong Credentials");
}
});

//logout route
app.post("/user/logout", auth,cors(), async(req, res)=> {
  try{
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token
    })
    await req.user.save()

    res.send()
  }catch(e){
    res.status(500)
  }
})

//logout out of all sessions
app.post("/user/logoutall", auth, async(req, res)=> {
  try{
    req.user.tokens = []
    await req.user.save()
    res.send()
  }catch(e){
    res.status(500);
  }
})

//mainlink create
app.post('/mainlink/create/:id',auth,(req,res)=>{
	var mainlink = req.body.mainlink
	User.findByIdAndUpdate({"_id":req.params.id},                                                      {"mainlink": mainlink},
						   function(err,result){
		        if(err){
            res.send(err)
        }
        else{
            res.json(result);
        }
	})
})




//sublinks create 
app.post('/sublinks/create/:id',(req,res)=>{
	User.findByIdAndUpdate({"_id":req.params.id},{"$push": {"sublinks" : [ {"name" : req.body.name , "link" : req.body.link}]}},{"new": true, "upsert": true},
						   function(err,result){
		        if(err){
            res.send(err)
        }
        else{
            res.json(result);
        }
	})
})
//main link read
app.get('/mainlink/:username',(req,res)=>{
	User.find({"username":req.params.username},function(err,result){
		        if(err){
            res.send(err)
        }
        else{
            res.json(result);
        }
	})
})
//sublink count update
app.get('/sublink/count/:id',auth,(req,res)=>{
	User.findOneAndUpdate({"sublinks._id":req.params.id}, {$inc:{"sublinks.$.count":1}},
    (err, result) => {
    if (err) {
      res.json({
        status:400,
        success:false, 
        message:err
      })
    }
    else{	
    res.json(result);
    }
  }) 
})
//sublink update
app.post('/sublinks/update/:id',(req,res)=>{
	User.findOneAndUpdate({"sublinks._id":req.params.id},{"$set": {"sublinks.$.name" :req.body.name , "sublinks.$.link" : req.body.link}},{"new": true, "upsert": true},
						   function(err,result){
		        if(err){
            res.send(err)
        }
        else{
            res.json(result);
        }
	})
})
//sublink delete
app.get('/sublinks/delete/:id',(req,res)=>{
	User.findOneAndUpdate({"sublinks._id":req.params.id},{"$pull": {"sublinks" : {_id:req.params.id}}},{"new": true, "upsert": true},
						   function(err,result){
		        if(err){
            res.send(err)
        }
        else{
            res.json(result);
        }
	})
})
//mainlink update
app.post('/mainlink/update/:id',auth,(req,res)=>{
	var mainlink = req.body.mainlink
	User.findByIdAndUpdate({"_id":req.params.id},                                                      {"mainlink": mainlink},
						   function(err,result){
		        if(err){
            res.send(err)
        }
        else{
            res.json(result);
        }
	})
})

//mainlink count update 
app.get('/mainlink/:id',auth,(req,res)=>{
	User.findByIdAndUpdate({"_id":req.params.id},{$inc:{countmainlink:1}},(err, result) => {
    if (err) {
      res.json({
        status:400,
        success:false,
        message:err
      })
    }
    else{	
    res.json(result);
    }
  }) 
}) 



var port = process.env.PORT || 3000;
app.listen(port, function(){
	console.log("server started");
});