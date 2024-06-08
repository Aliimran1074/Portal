    const express = require('express');
    const mysql = require('mysql');
    const cors = require('cors');
    const multer = require('multer');
    const path = require('path');
    // const fs = require('fs');
    const app = express();
    app.use(express.json());
    app.use(cors());
    app.use(express.static('./userApi/public'));

    const database = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'university'
    })

    database.connect((error) => {
    if (error) {
        console.log('Error connecting to database:', error);
        return;
    }
    console.log('Database connected with Id:', database.threadId);
    });

    const storage = multer.diskStorage(
        {
    destination: (req, file, callBack) => {
        callBack(null, './userApi/public/images');  //null indicates no error (first parameter is for error)
    },
    filename: (req, file, callBack) => {
        callBack(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
    }
    });

    const upload = multer({  storage: storage}).single('image'); // Use single() instead of array() if expecting a single file





    // const tableExist = async (tableName) => {
    //     try {
    //         const result = await database.query(`SHOW TABLES LIKE '${tableName}'`);
    //         return result.length > 0;
    //     } catch (error) {
    //         throw error;
    //     }
    // };


const tableExist = async (tableName) => {
    try {
        const sql = `SHOW TABLES LIKE '${tableName}'`;
        const data = await new Promise((resolve, reject) => {
            database.query(sql, (error, data) => {
                if (error) {
                    console.log('Error in tableExist function:', error);
                    reject(error);
                } else {
                    resolve(data);
                }
            });
        });
        return data.length > 0;
    } catch (error) {
        console.log('Error in tableExist function:', error);
        throw error;
    }
}



const createTable = async (tableName) => {
        let createTableQuery;
        if (tableName === 'studentsinfo') {
            createTableQuery = `CREATE TABLE IF NOT EXISTS ${tableName} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50),
                email VARCHAR(40),
                contactNo VARCHAR(12),
                semester VARCHAR(40),
                department VARCHAR(40),
                address VARCHAR(100),
                gender VARCHAR(30), 
                image VARCHAR(50),
                password VARCHAR(10)
            )`;
        } else if(tableName==='staffinfo') {
            createTableQuery = `CREATE TABLE IF NOT EXISTS ${tableName} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(40),
                designation VARCHAR(20),
                department VARCHAR(20),
                contactNo VARCHAR(12),
                email VARCHAR(30),
                address VARCHAR(100),
                gender VARCHAR(30), 
                image VARCHAR(200),
                password varchar(15)
            )`;
        }
        else if(tableName==='coursedetail') {
            createTableQuery = `CREATE TABLE IF NOT EXISTS ${tableName} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                Coursename VARCHAR(40) ,
                department VARCHAR(20),
                semester VARCHAR(20),
                isAvailable boolean default true        )`
        }
        else if(tableName==='teachercourses'){
            createTableQuery=`CREATE TABLE IF NOT EXISTS ${tableName} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                courseId INT,
                teacherId INT,
                FOREIGN KEY (courseId) REFERENCES coursedetail(id) on delete cascade,
                FOREIGN KEY (teacherId) REFERENCES staffinfo(id)  
            )`
        }
        else if(tableName==='complains'){
            createTableQuery=`CREATE TABLE IF NOT EXISTS ${tableName} (
                complainId INT AUTO_INCREMENT PRIMARY KEY,
                studentId INT,
                complainTitle varchar(50),
                complainDescription varchar(500),
                date varchar(50),
                FOREIGN KEY (studentId) REFERENCES studentsinfo(id) on delete cascade  
            )`
        }
        else{
            createTableQuery=`CREATE TABLE IF NOT EXISTS ${tableName} (
                contentId INT AUTO_INCREMENT PRIMARY KEY,
                courseId INT,
                teacherId INT,
                contentTitle varchar(50),
                content varchar(50),
                FOREIGN KEY (courseId) REFERENCES coursedetail(id) on delete cascade,
                FOREIGN KEY (teacherId) REFERENCES staffinfo(id)  
            )`
        }
        try {
            await database.query(createTableQuery);
        } catch (error) {
            throw error;
        }
    }

    // async function resetIdCount(tableName) {
    //     try {
    //         const currentYear = new Date().getFullYear();
    //         const lastRecord = await database.query(`SELECT MAX(id) AS maxId FROM ${tableName}`)
            
    //         if (lastRecord && lastRecord[0] && lastRecord[0].maxId !== null) {
    //             const lastYear = await database.query(`SELECT YEAR(created_at) AS year FROM ${tableName} WHERE id = ?`, [lastRecord[0].maxId]);
                
    //             if (lastYear && lastYear[0] && lastYear[0].year !== currentYear) {
    //                 await database.query(`ALTER TABLE ${tableName} AUTO_INCREMENT = 1`); 
    //             }
    //         }
    //     } catch (error) {
    //         console.log("Error resetting id", error);
    //     }
    // }


                // Admin End Points


// Get Overall Faculty
app.get('/overallFaculty',(request,response)=>{
    const sql= 'select * from staffinfo'
    database.query(sql,(error,data)=>{
        if(error){
            return response.json(error)
        }
        else{
            console.log(data)
            return response.json(data)
        }
    })
})


// Get Existing  Course in Database
app.get('/getCourse',(request,response)=>{
    const sql= 'select * from coursedetail'
    database.query(sql,(error,data)=>{
        if(error){
            return response.json(error)
        
        }
        else{
            return response.json(data)
        }
    })
})

// get available Complains
app.get('/complains',(request,response)=>{
    try{
        const sql= 'select * from complains'
            database.query(sql,(error,data)=>{
                if(error){
                    return response.json(error)
                }
                else{
                    // console.log(data)
                    return response.json(data)
                }
            })
    }
        catch(error){
            console.log("Error in getting complains",error)
        }
        })




                //get Students of Respectible Departs Admin
    app.get('/:addDepart', (request, response) => {
        // response.send('Welcome to the backend server!');
    const sql="select * from studentsinfo where department = ?"
    const department= request.params.addDepart
        database.query(sql,department,(error,data)=>{
            if(error){
                return response.json(error)
            }
            else{
                return response.json(data)
            }
        })
    })


// Add Students Data
     app.post('/create', async (req, res) => {
        const tableName = 'studentsinfo';
        try {
            const exists = await tableExist(tableName);
            if (!exists) {
                await createTable(tableName);
            }
            upload(req, res, async (err) => {
                if (err) {
                    return res.status(500).json({ message: 'Error in adding Course Content', error: error })
                }
                if (!req.file) {
                    return res.status(400).json({ message: 'File not found' });
                } 
                const sql = `INSERT INTO ${tableName} (name, email, contactNo, semester, department, address,gender, image,password) VALUES (?, ?, ?, ?, ?, ?, ?,?,?)`;
                const image = req.file.filename;
                const values = [req.body.addName, req.body.addEmail, req.body.addContact, req.body.addSemester, req.body.addDepart, req.body.addAddress,req.body.addGender, image,req.body.addPassword];
                // await resetIdCount(tableName);
                database.query(sql, values, (error, data) => {
                    if (error) {
                        return res.status(500).json({ message: 'Error inserting data into database', error: error });
                        } else {
                        return res.status(200).json({ message: 'Data inserted successfully' });
                    }
                });
            });
        } catch (error) {
            console.log('Error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    })

// Update Student Data
    app.put('/update',(req,res)=>{
        const sql = 'update studentsInfo set `name`=?,`email`=?,`contactNo`=?,`semester`=? ,`address`=? ,`gender`=? where `id`=?'
        const values= [req.body.updateName,req.body.updateEmail,req.body.updateContact,req.body.updateSemester,req.body.updateAddress,req.body.updateGender,req.body.updateId]
        database.query(sql,values,(error,data)=>{
            if(error){
                console.log(error)
                return res.json(error)  
            }
    else{
        console.log(data)
        return res.json(data)
    }
        })
    })


// Delete Data of Specific Student
app.delete('/deleteStudent/:id/:depart',(req,res)=>{
    const sql='Delete from studentsinfo where id =? and department =?'
    const id= req.params.id
    const department = req.params.depart
    database.query(sql,[id,department],(error,data)=>{
        if(error){
            return res.json("Error")
        }
        else{
            return res.json(data)
        }
    })
})


// Add Teachers Data
    app.post('/createTeacher', async (req, res) => {
        const tableName = 'staffinfo';
        try {
            const exists = await tableExist(tableName);
            if (!exists) {
                await createTable(tableName);
            }
            upload(req, res, async (err) => {
                if (err) {
                    return res.status(400).json({ message: 'Error uploading file', error: err });
                }
                if (!req.file) {
                    return res.status(400).json({ message: 'File not found' });
                }
                const sql = `INSERT INTO ${tableName} (name, email, contactNo, designation, department, address,gender, image,password) VALUES (?,?,?,?,?,?,?,?,?)`;
                const image = req.file.filename;
                const values = [req.body.addName, req.body.addEmail, req.body.addContact, req.body.designation, req.body.addDepart, req.body.addAddress,req.body.addGender, image,req.body.addPassword]
                // await resetIdCount(tableName);
                database.query(sql, values, (error, data) => {
                    if (error) {
                        return res.status(500).json({ message: 'Error inserting data into database', error: error });
                    } else {
                        return res.status(200).json({ message: 'Data inserted successfully' });
                    }
                });
            });
        } catch (error) {
            console.log('Error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    })


    // Update Teacher Data
        app.put('/updateTeacher',(req,res)=>{
        const sql = 'update staffinfo set `name`=?,`email`=?,`contactNo`=?,`address`=?,`gender`=? where `id`=?'
        const values= [req.body.updateName,req.body.updateEmail,req.body.updateContact,req.body.updateAddress,req.body.updateGender,req.body.updateId]
        database.query(sql,values,  (error,data)=>{
            if(error){
                console.log(error)
                return res.json(error)
            }
    else{
        console.log(data)
        return res.json(data)
    }
        })
    })


// Delete Info of Staff 
app.delete('/deleteStaff/:id/:designation',(req,res)=>{
    const sql='Delete from staffinfo where id =? and designation =?'
    const id= req.params.id
    const designation = req.params.designation
    database.query(sql,[id,designation],(error,data)=>{
        if(error){
            return res.json("Error")
        }
        else{
            return res.json(data)
        }
    })
})


// Add Info of Staff Of Any designation except Teacher
app.post('/createStaff', async (req, res) => {
    const tableName = 'staffinfo';
    try {
        const exists = await tableExist(tableName);
        if (!exists) {
            await createTable(tableName);
        }
        upload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ message: 'Error uploading file', error: err });
            }
            if (!req.file) {
                return res.status(400).json({ message: 'File not found' });
            }
            const sql = `INSERT INTO ${tableName} (name, email, designation,contactNo ,address,gender,image) VALUES (?,?,?,?,?,?,?)`;
            const image = req.file.filename;
            const values = [req.body.addName, req.body.addEmail, req.body.addDesignation, req.body.addContact, req.body.addAddress,req.body.addGender, image]
            // await resetIdCount(tableName);
            database.query(sql, values, (error, data) => {
                if (error) {
                    return res.status(500).json({ message: 'Error inserting data into database', error: error });
                } else {
                    return res.status(200).json({ message: 'Data inserted successfully' });
                }
            });
        });
    } catch (error) {
        console.log('Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
})



// Get  Information of Staff with respective designation
app.get('/overallInfo/:designation',(request,response)=>{
    const sql= 'select * from staffinfo where designation =?'
    const designation =request.params.designation
    database.query(sql,designation,(error,data)=>{
        if(error){
            return response.json(error)
        }
        else{
            return response.json(data)
        }
    })
})


    // Get Teacher of Specific Department

app.get('/:designation/:addDepart', (request, response) => {
        // response.send('Welcome to the backend server!');
    const sql='select * from staffInfo where designation =? and department = ?'
        const designation= request.params.designation
        const department = request.params.addDepart
        database.query(sql,[designation,department],(error,data)=>{
            if(error){
                return response.json(error)
            }
            else{
                return response.json(data)
            }
        })
    })





// Create/Add a new Course in Database
app.post('/createCourse',async(req,res)=>{
    const tableName='courseDetail'
    try{
        const exist= await tableExist(tableName)
        if(!exist){
            createTable(tableName)
        }
        const sql=`INSERT INTO ${tableName} (Coursename,department,semester) VALUES (?,?,?)`
        const values=[req.body.addName,req.body.addDepart,req.body.addSemester]
        database.query(sql,values,(error,data)=>{
if(error){
    return res.status(500).json({message:"Inserting data issue",error:error})
}
else{
    return res.status(200).json({message:'Data inserted successfully'})
}
    })
    }
    catch(error){
        console.log('Error:',error)
        return res.status(500).json({message:"Internal server error"})
    }
})


// Delete Existing Course
app.delete('/deleteCourse',(req,res)=>{
    const sql='Delete from coursedetail where id =?'
    let id = req.body.id
    console.log(id)
    console.log(req.body)
    database.query(sql,[id],(error,data)=>{
        if(error){
            console.log(error)
            return res.json(error)
        }
        else{
            return res.json(data)
        }
    })
})


// Update Existing Course
app.put('/updateCourse',(req,res)=>{
    const sql='update courseDetail set `Coursename` =? ,`semester` =? where `id`=?'
    const values=[req.body.updateName,req.body.updateSemester,req.body.updateId]
    database.query(sql,values,(error,data)=>{
if(error){
    console.log(error)
    return res.json(error)
}
else{
    console.log(data)
    return res.json(data)
}
    })
})




// Authentication For Teacher
app.post('/facultyAuthentication',(req,res)=>{
    const sql='select * from staffInfo where email=? and password =?'
    const values=[req.body.teacherEmail,req.body.teacherPassword]
    database.query(sql,values,(error,data)=>{
        if(error){
            console.log(error)
            return res.json(error)
        }
        else{
            console.log(data)
            return res.json(data)
        }
    })    
})

// Authentication For Student
app.post('/studentAuthentication',(req,res)=>{
    const sql='select * from studentsinfo where email=? and password =?'
    const values=[req.body.studentEmail,req.body.studentPassword]
    database.query(sql,values,(error,data)=>{
        if(error){
            console.log(error)
            return res.json(error)
        }
        else{
            console.log(data)
            return res.json(data)
        }
    })    
})



// End Points For Teacher

// Add Course Content of Specific Subject/Course
    app.post('/addContent',async(req,res)=>{
    const tableName='courseContent'
    try{
        const exists = await tableExist(tableName);
        if (!exists) {
            await createTable(tableName);
        }
        upload(req,res,async(error)=>{
            if(error){ 
                console.log('Error',error)
                return res.status(500).json({ message: 'Error in adding Course Content', error: error })
            }
            if(!req.file){
                console.log('File not found')
            }
            else{
                console.log('Function is working')
                const sql =`insert into ${tableName} (courseId,teacherId,contentTitle,content) values (?,?,?,?)`
                const content=req.file.filename
                const values=[req.body.courseId,req.body.teacherId,req.body.title,content]
                database.query(sql,values,(error,data)=>{
                    if(error){
                        console.log(error)
                        return res.json(error)
                    }
                    else{
                        console.log(data)
                        return res.json(data)
                    }
                })
            
            }

        })
    }catch(error){
        console.log("Error in add Content ",error)
    }
    })

    
    
// Exisiting Content 
app.post('/availableContent',async(req,res)=>{
    const tableName= 'coursecontent'
    try{
        const exists = await tableExist(tableName);  
        if(!exists){
            console.log('Table not exist ')
            return res.send ('Table is not available')
        }
        else{
            const sql= 'select * from coursecontent where courseId = ? '
            const courseId= req.body.courseId
            database.query(sql,[courseId],(error,data)=>
            {
                if(error){
                    console.log("Error in query section :",error)
                        return res.json("Error in query section",error)
                }
                else{ 

                    console.log("Data : ",data)
                    return res.json(data)
                }
            })
        }
    }
    catch(error){
        console.log("Error in getting content",error)
    }
})



// Get Teacher of Specific Teacher
app.post('/getTeacherData',(req,res)=>{
    const sql ='select * from staffInfo where id=?'
    const id=req.body.teacherId
    database.query(sql,[id],(error,data)=>
    {
        if(error){
            console.log('Error in getting teacher data',error)
            return res.json(error)
        
        }
        else{
            console.log(data)
            return res.json(data)
        }
    })
})



// Get Courses Available For Enrollment
app.post('/gettingCourse',(request,response)=>{
    const sql='select * from coursedetail where department =? and isAvailable =true'
    const department= request.body.teacherDepart
    database.query(sql,[department],(error,data)=>
    {
        if(error){
            console.log(error)
            return response.json(error)
        }
        else{
            console.log(data)
            return response.json(data)
        }
    })
})


// Enrolled Courses of Specific Teacher
app.post ('/enrolledCourses',(req,res)=>{
    let sql='select * from teachercourses where teacherId= ?'
    let teacherId= req.body.teacherId
    database.query(sql,[teacherId],(error,data)=>{
        if(error){
            console.log(error)
            return res.json(error)
        }
        else{
            let coursesArray=[]
            // console.log(data)
            data.map((currentElement,currentIndex)=>{
                coursesArray.push(currentElement.courseId)
            })
            if(coursesArray.length===0){
                res.send('No data found in array')
            }
            else{
            console.log(coursesArray)
            
        let sqlForAllCourses='select * from coursedetail where id in (?)'
        let values=[coursesArray]
        database.query(sqlForAllCourses,values,(error,data)=>{
            if(error){
                console.log(error)
            }
            else{
                console.log(data)
                return res.json(data)
            }
        })
        }
    }
    })
})          


    // Endpoint to select a course
    app.post('/selectCourse',async(req,res)=>{
        let sql='select isAvailable from coursedetail where id=?'
        let courseId=req.body.courseId
        let teacherId=req.body.teacherId
        database.query(sql,[courseId],async(error,data)=>{
            if(error){
                console.log(error)
                return res.json(error)
            }
            else{
                console.log(data)
                if(data.length===0||!data[0].isAvailable){
                    return res.status(400).send('Course not available')
                }
                else{
                    const tableName='teacherCourses'
                    try{
                        const exist =await tableExist(tableName)
                        if (!exist){
                            await createTable(tableName)
                        }
                        let sql=`insert into ${tableName} (courseId,teacherId) values (?,?)`
                        let values=[courseId,teacherId]
                        database.query(sql,values,(error,result)=>{
                            if(error){
                                console.log(error)
                                return res.send('Error in inserting data on teacherCoursetable',error)
                            }
                            else{
                                console.log(data)
                                let sql='update coursedetail set isAvailable =false where id = ? '
                                let values=[courseId]
                                database.query(sql,values,(error,result)=>{
                                    if(error){
                                        res.send('Error in update values of isAvailable in coursedetail ',error)
                                    }
                                    else{
                                            res.send('Update Successfully')                 
                                    }
                                
                                })
                            
                                // return res.json(data)
                            }
                        })
                    } 
                    catch(error){
                        console.log('Error after try block',error)
                    }               
                }
            }

        })
    })


    // get Students of Particular Course
    app.post('/getStudentsOfCourse',(req,res)=>{
        let sql='select * from  coursedetail where id =?'
        let values=[req.body.courseId]
        database.query(sql,values,(error,data)=>{
        if(error){
            console.log(error)
            return res.json(error)
        }
        else{
            
            console.log(data)
            if(data.length>0){
    
            let    getSemester=data[0].semester
            let   getDepart=data[0].department
            let     getCourseName=data[0].Coursename
                let gettingstudentSQl='select * from studentsinfo where semester=? and department=?'   
                let values=[getSemester,getDepart]
                database.query(gettingstudentSQl,values,(error,data)=>{
                    if(error){
                        console.log('Error in getting stundent data',error)
                        return res.json(error)   
                }
                else{
                    console.log(data)
                    data.push(getCourseName)
                    return res.json(data)
    
                }
                })
    
    
            }
            // console.log(getSemester,getDepart)
            // return res.json(data)
    
        }
    
        })
    
    
    
        })


// Change Teacher Password
app.post('/changeTeacherPassword',(req,res)=>{
    let sql='select * from staffinfo where id =?'
    let id = req.body.id
    database.query(sql,[id],(error,data)=>{
        if(error){
            console.log(error)
            return res.json(error)
        }
        else{
            console.log(data)
            let oldPassword=req.body.oldPassword
            console.log(oldPassword)
            console.log(data[0].password)
    if(!(oldPassword===data[0].password)){
        return res.json('Invalid old password')
        }
        else{
            let newPassword=req.body.newPassword
            let sql= 'update staffinfo set password = ? where id =?'
            let values=[newPassword,id]
            database.query(sql,values,(error,data)=>{
                if(error){
                    console.log(error)
                    return res.json(error)
                }
                else{
                    console.log(data)
                    
                    return res.json(data)

                }
            })
        }
    }
    })
})  




// End Points For Students

// Get Data of Specific Student
app.post('/getStudentData',(req,res)=>{
    const sql ='select * from studentsinfo where id=?'
    const id=req.body.studentId
    database.query(sql,[id],(error,data)=>
    {
        if(error){
            console.log('Error in getting student data',error)
            return res.json(error)
        
        }
        else{
            console.log(data)
            return res.json(data)
        }
    })
})

    // Get Previous Complain OF Specific Student
    app.post('/previousComplain',async(req,res)=>{
        const tableName='complains'
        try{
    let exists =await tableExist(tableName)
    // console.log("exists",exists)        
    if(exists){
                let sql=`select * from ${tableName} where studentId=?`
                let studentId=req.body.studentId
                database.query(sql,[studentId],(error,data)=>{
                    if(error){
                        console.log("Error",error)
                        return res.json(error)  
                    }
                    else{
                        console.log('Data',data)
                        return res.json(data)
                    }
                })
            }
            else{
                return res.json('No table Found')
            }
        }    catch(error){
            console.log("Error",error)
        }
        
    })


    // Create Complain with studentId
app.post('/createComplain',async(req,res)=>{
        const tableName='complains'
        try{
            const exist= await tableExist(tableName)
            if(!exist){
                createTable(tableName)
            }
            let studentId=req.body.studentId
                let sql ='select COUNT(*) as count from complains where studentId= ?'
                let values=[studentId]  
                database.query(sql,values,(error,data)=>{
                    if(error){
                        console.log(error)
                        return res.json(error)
                    }
                    else{
                        const count = data[0].count
                       if(count>3){
                        return res.send('Already has 3 complains')
                       }
                       else{
                  const sql=`INSERT INTO ${tableName} (studentId,complainTitle,complainDescription,date) VALUES (?,?,?,?)`
            const values=[studentId,req.body.complainTitle,req.body.complainDescription,req.body.date]
            database.query(sql,values,(error,data)=>{
                if(error){
                    console.log(error)
                    return res.json(error)
                }
                else{   
                    console.log(data)
                    return res.json(data)

                }
                       })
                       }
                    }
                })
            }
    
        catch(error){
            // console.log('Error:',error)
            return res.json(error)
        }
    })



// Get Courses of Students According to Department and Semster
app.post('/getCourses',(req,res)=>{
    let sql='select department,semester from studentsinfo where id =?'
   let values=[req.body.studentId]
    database.query(sql,values,(error,data)=>{
        if(error){
            console.log(error)
        }
        else{
            console.log(data)
            let department=data[0].department
            let semester= data[0].semester
            console.log(department,semester)

            let sql='select * from coursedetail where semester = ? and department = ?'
            let values=[semester,department]
            database.query(sql,values,(error,data)=>{
                if(error){
                    console.log("error ",error)
                    return res.json(error)
                }
           
                else{
                    console.log(data)
                    return res.json(data)
                }
            })
        }
    })
})
    
// Change Student Password
app.post('/changeStudentPassword',(req,res)=>{
    let sql='select * from studentsinfo where id =?'
    let id = req.body.id
    database.query(sql,[id],(error,data)=>{
        if(error){
            console.log(error)
            return res.json(error)
        }
        else{
            console.log(data)
            let oldPassword=req.body.oldPassword
            console.log(oldPassword)
            console.log(data[0].password)
    if(!(oldPassword===data[0].password)){
        return res.json('Invalid old password')
        }
        else{
            let newPassword=req.body.newPassword
            let sql= 'update studentsinfo set password = ? where id =?'
            let values=[newPassword,id]
            database.query(sql,values,(error,data)=>{
                if(error){
                    console.log(error)
                    return res.json(error)
                }
                else{
                    console.log(data)
                    
                    return res.json(data)

                }
            })
        }
    }
    })
})  


    app.listen(8050,()=>{
            console.log('Listen')
    })





    // // Define a cron job to run daily at midnight
    // const job = new CronJob('0 0 * * *', async () => {
    //     console.log('Running scheduled task...');
    //     try {
    //       await resetIdCount();
    //       console.log('Id count reset successfully');
    //     } catch (error) {
    //       console.error('Error running scheduled task:', error);
    //     }
    //   });






    // to upload image first install multer then install path


















