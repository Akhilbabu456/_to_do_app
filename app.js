const http= require("http")
const fs= require("fs")
const MongoClient= require("mongodb").MongoClient
const cheerio= require("cheerio")
const qs = require("qs")
const port= 3000
const url= "mongodb://localhost:27017/"
const homePage= `${__dirname}/index.html`


http.createServer((req,res)=>{
  var showTask= async(res)=>{
    try{
       let client=await MongoClient.connect(url)
       let db= client.db("ToDo")
       let document=await db.collection("Data").find().toArray()
       const html = fs.readFileSync(homePage)
       const $ = cheerio.load(html)
       $('.old-element').replaceWith(`
       <ol class="old-element">
       ${document.map((doc)=>`
       <li class="task-item">
       <form action="/?checkbox=someValue" method="get" id="checkbox-form-${doc._id}">
       <input type="hidden" name="checkbox" value="${doc._id}">
       <input type="checkbox" id="check${doc._id}" class="check-box" onchange="submit()" ${doc.checked ? 'checked' : ''}>&nbsp<label class="task-text" for="check${doc._id}">${doc.task}</label>
        </form>
       <form action="/?deleteValue=someValue" method="get" class="delete-form">
       <button type="submit" name="deleteValue" value="${doc._id}" class="btn btn-danger delete-icon">
         <i class="bi bi-trash"></i>
      </button>
      </form>
      <!-- Button trigger modal -->
      <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#exampleModal-${doc._id}" data-task-id="${doc._id}">
      <i class="bi bi-pencil-square"></i>
      </button>
      
      <!-- Modal -->
      <div class="modal fade" id="exampleModal-${doc._id}" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel${doc._id}" aria-hidden="true">
        <div class="modal-dialog" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="exampleModalLabel${doc._id}">Update</h5>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div class="modal-body">
            <form action="/?updateValue=someValue" method="get">
            <input type="hidden" name="taskId" value="${doc._id}">
            <label>Enter the updated task:</label><br>
            <input type="text" name="task" value="${doc.task}" placeholder="Enter task here" required><br>
            <button type="submit" name="updateValue" class="update-button">Update</button>
          </form> 
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
       
     </li>
       `).join('')}
       </ol>
       `)
    const modifiedHtml = $.html()
    fs.writeFileSync(homePage, modifiedHtml)
    fs.readFileSync(homePage, (err,data)=>{
      res.write(data)
      res.end()
    })
    client.close()
    }catch(err){
        console.log(err)
       }
  }
    if(req.url=="/"){
        fs.readFile(homePage,(err,data)=>{
            if(err){
                console.log(err)
            }else{
                res.writeHead(200, {"Content-Type":"text/html"})
                res.write(data)
                showTask(res)
                res.end()
            }
            })
    }else if(req.url=="/submit"){
        let body=""
        req.on("data",(data)=>{
            body+= data.toString()
        })
        req.on("end", ()=>{
            let postParams= new URLSearchParams(body)
            var task= postParams.get("task")
            let insertTask= async()=>{
         try{
            let client= await MongoClient.connect(url)
            let db= client.db("ToDo")
            let i= await db.collection("Data").countDocuments()
            let documents=  await db.collection("Data").find().toArray()
            if(documents.length==0){
              var index= documents.length - 1
            }else{
              var index= documents.length - 1
            }
            if(i==0){
              i=i+1
              var input={
                _id: i,
                checked: false, 
                task: task
            }
            }else{
              let id= documents[index]._id
               id= id+1
               var input={
                _id: id,
                checked: false,
               task: task
            }
            }
           await db.collection("Data").insertOne(input)
            res.write(`
             <script>
             alert("Task has been added")
             window.location.assign("/")
             </script>
            `)
            res.end()
            client.close()
            }catch(err){
                console.log(err)
            }
            showTask(res)
         }
         insertTask()
         
        }) 
        
        }else if (req.method === 'GET') {
        const queryObject = qs.parse(req.url.split('?')[1]);
        const deleteValue = queryObject.deleteValue;
        const checkboxValue= queryObject.checkbox;
        const urlObject = new URL(req.url, `http://${req.headers.host}`);
        const taskId = urlObject.searchParams.get('taskId')
        const task = urlObject.searchParams.get('task');
        let id = deleteValue ? Number(deleteValue) : null;
        let num = taskId ? Number(taskId) : null;
        let check = checkboxValue ? Number(checkboxValue) : null;
        if(id){
        var deleteTask= async()=>{
            try{
             let url= "mongodb://localhost:27017/"
             let client= await MongoClient.connect(url)
             let db= client.db("ToDo")
                   let myQuery={
                       _id: id
                   }
                await db.collection("Data").deleteOne(myQuery)
                res.write(`
                 <script>
                  alert("Data deleted")
                  window.location.assign("/")
                 </script>
                `)
                 res.end()
                client.close()
            }catch(err){
             if(err) throw err
            }
            showTask(res)
        }
        deleteTask()
        
    }else if(num){
        var updateTask = async () => {
            try {
              let client = await MongoClient.connect(url)
              let db = client.db("ToDo")
              let myQuery = {
                _id: num
              };
              let newValue = {
                $set: {
                  task: task 
                }
              };
              await db.collection("Data").updateOne(myQuery, newValue);
              res.write(`
                <script>
                  alert("Data updated");
                  window.location.assign("/");
                </script>
              `);
              res.end();
              client.close();
            } catch (err) {
              if (err) throw err;
            }
            showTask(res)
          }
          updateTask()
          
    }else if(check){
      var checkTask = async () => {
          try {
            let client = await MongoClient.connect(url)
            let db = client.db("ToDo")
            let myQuery = {
              _id: check
            };
            let task= await db.collection("Data").find(myQuery).toArray()
            if(task[0].checked == true){
              var newValue= {
                $set:{
                  checked: false
                }
              }
            }else{
              var newValue = {
                $set: {
                  checked: true
                }
              };
            }
            
            await db.collection("Data").updateOne(myQuery, newValue);
            res.write(`
              <script>
                alert("Data updated");
                window.location.assign("/");
              </script>
            `);
            res.end();
            client.close();
          } catch (err) {
            if (err) throw err;
          }
          showTask(res)
        }
        checkTask()
        
  }else{
        fs.readFileSync(homePage, (err,data)=>{
            res.write(data)
            res.end()
        })
    }
        }else{
        fs.readFile(homePage, (err,data)=>{
            res.write(data)
            res.end()
        })
    }
    
})
.listen(port, ()=>{
    console.log(`Listening to the port: http://localhost:${port}`)
})

