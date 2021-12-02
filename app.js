//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");
const credentials = require(__dirname + "/keys.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

mongoose.connect(credentials.url);

const itemSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to our new and improved Todo List"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "<-- Hit the checkbox to select and delete this item"
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
});

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {
  // const day = date.getDate();
  Item.find({}, function(err, results) {
    if (results.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if(!err){
          console.log("Successfully added items!");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: results
      });
    }
  });
});

app.get("/about", function(req, res) {
  res.render("about");
});

app.get("/lists/:listCategory", function(req,res){
  const customListName = _.capitalize(req.params.listCategory);

  List.findOne({name: customListName}, function(err, listFound){
    if(!err){
      if(!listFound){
        //Create new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save(() => res.redirect("/lists/" + customListName));

      } else {
        //Show existing listTitle
        res.render("list", {listTitle: listFound.name, newListItems: listFound.items});
      }
    }
  });
});

app.post("/", function(req, res) {
  // console.log("Post function is activating");
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const newItem = new Item({
    name: itemName,
  });

  if(listName === "Today"){
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, listFound){
      listFound.items.push(newItem);
      listFound.save(() => res.redirect("/lists/"+listName));
    });
  }

});

app.post("/delete", function(req, res){
  const itemID = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndDelete(itemID, function(err){
      if(err){
        console.log(err);
      } else {
        console.log("Successfully removed item: " + itemID);
        res.redirect("/");
      }
    });

  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: itemID}}}, function(err, foundList){
      if(!err){
        res.redirect("/lists/"+listName);
      }
    });
  }


});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
