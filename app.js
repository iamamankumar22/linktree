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
var cors = require('cors');
const schedule = require('node-schedule');

const multer = require('multer');
const path = require('path');
const fs = require('fs');
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


//Sign-up
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

// Login
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
	User.findByIdAndUpdate({"_id":req.params.id},{"mainlink": mainlink},
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
app.get('/sublink/countinc/:id',(req,res)=>{
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
	User.findByIdAndUpdate({"_id":req.params.id},{"mainlink": mainlink},
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
app.get('/mainlink/countinc/:username',(req,res)=>{
	User.findOneAndUpdate({"username":req.params.username},{$inc:{countmainlink:1,dailycountmainlink:1}},{"multi": true},(err, result) => {
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


// Reset dailycountmainlink
schedule.scheduleJob('0 0 * * * *',() =>{
  User.updateMany({},{$set:{"dailycountmainlink": 0}}, (err,res)=>{
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


// Profile Pic
  var myStorage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,'uploads')
    },
    filename:function(req,file,cb){
        cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
  })

  var upload = multer({
    storage:myStorage
  });

  app.post('/upload/:username', async(req, res) => {
    var img = req.body.image;
      User.findOneAndUpdate({"username":req.params.username}, {"$set": {"img" : img}},(err, result) => {
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
  // app.post('/upload/:username', upload.single('myImage'), async(req, res) => {
  //   var img = fs.readFileSync(req.file.path);
  //   var encode_img = img.toString('base64');
  //   var finalImg = {
  //       contentType:req.file.mimetype,
  //       image:new Buffer(encode_img,'base64')
  //   };
  //     User.findOneAndUpdate({"username":req.params.username}, {"$set": {"img" : finalImg}},(err, result) => {
  //       if (err) {
  //         res.json({
  //           status:400,
  //           success:false, 
  //           message:err
  //         })
  //       }
  //       else{	
  //           res.json(result);
  //       }
  //     })  
  // })

var port = process.env.PORT || 3000;
app.listen(port, function(){
	console.log("server started");
});