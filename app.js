const express = require("express");
const hbs = require("hbs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const session = require("express-session");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "hbs");


app.use(session({
    secret: "bankingappsecretkey", 
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 3600000 
    }
}));
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.redirect("/Login");
};

mongoose.connect("mongodb://localhost:27017/BankManagement", {
}).then(() => {
    console.log("MongoDB Connected");
}).catch(() => {
    console.log("Failed To Connect");
});

const BankSchema = new mongoose.Schema({
    name: String,
    accnum: Number,
    phno: Number,
    ifsc: String,
    email: String,
    password: String,
    conformpassword: String,
    Bank_Amount:{type:Number,default : 0},
});
const BankAccounts = mongoose.model("BankAccounts", BankSchema);

const LoanSchema = new mongoose.Schema({
    name: String,
    accnum: Number,
    phno: Number,
    ifsc: String,
    email: String,
    loanamount: Number,
    loan_option: String,
});
const LoanAccounts = mongoose.model("LoanAccounts", LoanSchema);

const CustomerCareSchema = new mongoose.Schema({
    email:String,
    Account_Number:Number,
    Phone_Number:Number,
    Problem:String
});
const Customer_Care = mongoose.model("Customer_Care",CustomerCareSchema);


app.get("/", (req, res) => {
    res.render("home");
});

app.get("/Login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render('register');
});

app.get("/features", (req, res) => {
    res.render("features");
});

app.get("/security", (req, res) => {
    res.render("security");
});

app.get("/accdashboard", isAuthenticated, (req, res) => {
    res.render('accdashboard', { name: req.session.user.name });
});

app.get("/loan", isAuthenticated, (req, res) => {
    res.render("loan", { loggedInUser: req.session.user.name });
});

app.get("/customercare", isAuthenticated, (req, res) => {
    res.render("customercare", { loggedInUser: req.session.user });
});

app.get("/depositamount", isAuthenticated, (req, res) => {
    res.render('depositamount', { loggedInUser: req.session.user.name });
});

app.get("/withdrawamount", isAuthenticated, (req, res) => {
    res.render("withdrawamount", { loggedInUser: req.session.user.name });
});

app.get("/transferamount", isAuthenticated, (req, res) => {
    res.render("transferamount", { loggedInUser: req.session.user });
});

app.get("/accdver", isAuthenticated, (req, res) => {
    res.render("accdver", { loggedInUser: req.session.user.name });
});

app.get("/accver", isAuthenticated, (req, res) => {
    res.render("accver", { loggedInUser: req.session.user.name });
});

app.get("/anaver", isAuthenticated, (req, res) => {
    res.render("anaver", { loggedInUser: req.session.user.name });
});

app.get("/analytics", isAuthenticated, (req, res) => {
    res.render("analytics", { loggedInUser: req.session.user.name });
});

app.get("/accountsdetails", isAuthenticated, async (req, res) => {
    try {
        // Only get account details for the logged-in user
        const account = await BankAccounts.findOne({ name: req.session.user.name });
        res.render("accountsdetails", { 
            account,
            loggedInUser: req.session.user.name 
        });
    } catch (err) {
        console.error(err);
        res.status(500).render("error", { 
            errorMessage: "Failed to fetch account details",
            loggedInUser: req.session.user.name
        });
    }
});


app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});


app.post("/register", async (req, res) => {
    try {
        const data = {
            name: req.body.name,
            accnum: req.body.accnum,
            phno: req.body.phno,
            ifsc: req.body.ifsc,
            email: req.body.email,
            password: req.body.password,
            conformpassword: req.body.conformpassword,
            Bank_Amount: 0
        };
      
        const exuser = await BankAccounts.findOne({name: data.name});
        if(exuser) {
            return res.status(400).render("register", {errorMessage: "Username Already Exists"});
        }
        
        const exaccnum = await BankAccounts.findOne({accnum: data.accnum});
        if(exaccnum) {
            return res.status(400).render("register", {errorMessage: "Account-Number Already Exists"});
        }
        
        const exphno = await BankAccounts.findOne({phno: data.phno});
        if(exphno) {
            return res.status(400).render("register", {errorMessage: "Phone-Number Already Exists"});
        }
        
        const exifsc = await BankAccounts.findOne({ifsc: data.ifsc});
        if(exifsc) {
            return res.status(400).render("register", {errorMessage: "IFSC Already Exists"});
        }
        
        const exemail = await BankAccounts.findOne({email: data.email});
        if(exemail) {
            return res.status(400).render("register", {errorMessage: "Email Already Exists"});
        }
        
        if(data.password !== data.conformpassword) {
            return res.status(400).render("register", {errorMessage: "Passwords do not match"});
        }
        
        await BankAccounts.insertMany(data);
        return res.status(200).render("register", {successMessage: "Account Created Successfully"});
    } catch (error) {
        console.error("Registration Error:", error);
        return res.status(500).render("register", {errorMessage: "Internal Server Error"});
    }
});


app.post("/Login", async (req, res) => {
    try {
        const { name, password } = req.body;

        const user = await BankAccounts.findOne({ name });

        if (!user) {
            return res.status(400).render("login", { errorMessage: "Username does not exist" });
        }

        if (user.password !== password) {
            return res.status(400).render("login", { errorMessage: "Incorrect password" });
        }


        req.session.user = {
            id: user._id,
            name: user.name,
            accnum: user.accnum,
            email: user.email
        };

        res.redirect("/accdashboard");

    } catch (error) {
        console.log("Login Error:", error);
        res.status(500).render("login", { errorMessage: "Internal Server Error" });
    }
});

app.post('/loan', isAuthenticated, async (req, res) => {
    try {
        const {name, accnum, phno, ifsc, email, loanamount,loanoption} = req.body;

        
        if (name !== req.session.user.name) {
            return res.status(403).render('loan', {
                errorMessage: "You can only apply for a loan using your own account",
                loggedInUser: req.session.user.name
            });
        }

        const user = await BankAccounts.findOne({name});

        if(!user) {
            return res.status(404).render('loan', {
                errorMessage: "Username does not exist",
                loggedInUser: req.session.user.name
            });
        }
        
        if(String(user.accnum) !== String(accnum)) {
            return res.status(404).render('loan', {
                errorMessage: 'Incorrect Account Number',
                loggedInUser: req.session.user.name
            });
        }
        
        if(String(user.phno) !== String(phno)) {
            return res.status(404).render('loan', {
                errorMessage: 'Incorrect Phone Number',
                loggedInUser: req.session.user.name
            });
        }
        
        if(String(user.ifsc) !== String(ifsc)) {
            return res.status(404).render('loan', {
                errorMessage: 'Incorrect IFSC Code',
                loggedInUser: req.session.user.name
            });
        }
        
        if(String(user.email) !== String(email)) {
            return res.status(404).render('loan', {
                errorMessage: 'Incorrect Email Address',
                loggedInUser: req.session.user.name
            });
        }
        
        await LoanAccounts.create({name, accnum, phno, ifsc, email, loanamount, loanoption});
        return res.status(200).render('loan', {
            successMessage: "Loan Form Submitted Successfully",
            loggedInUser: req.session.user.name
        });
    } catch (error) {
        console.error("Loan Application Error:", error);
        return res.status(500).render('loan', {
            errorMessage: "Internal Server Error",
            loggedInUser: req.session.user.name
        });
    }
});


app.post("/customercare", isAuthenticated, async (req, res) => {
    try {
        const { email, accnum, phno, Problem } = req.body;
        
       
        const user = await BankAccounts.findOne({ email });
        
        if (!user) {
            return res.status(400).render("customercare", {
                errorMessage: "Email does not exist",
                loggedInUser: req.session.user.name
            });
        }
        if (user.name !== req.session.user.name) {
            return res.status(403).render("customercare", {
                errorMessage: "You can only submit requests for your own account",
                loggedInUser: req.session.user.name
            });
        }
        
        if (String(user.accnum) !== String(accnum)) {
            return res.status(400).render("customercare", {
                errorMessage: "Incorrect Account Number",
                loggedInUser: req.session.user.name
            });
        }

        if (String(user.phno) !== String(phno)) {
            return res.status(400).render("customercare", {
                errorMessage: "Incorrect Phone Number",
                loggedInUser: req.session.user.name
            });
        }
        
        await Customer_Care.create({ 
            email, 
            Account_Number: accnum, 
            Phone_Number: phno, 
            Problem 
        });
        
        return res.status(200).render('customercare', {
            successMessage: "Request Submitted Successfully",
            loggedInUser: req.session.user.name
        });

    } catch (error) {
        console.error("Error in Customer Care Request:", error);
        res.status(500).render("customercare", {
            errorMessage: "Internal Server Error",
            loggedInUser: req.session.user.name
        });
    }
});
app.post('/depositamount', isAuthenticated, async (req, res) => {
    try {
        const data = {
            name: req.body.name,
            password: req.body.password,
            amount: parseFloat(req.body.amount),
        };
        if (data.name !== req.session.user.name) {
            return res.status(403).render('depositamount', {
                errorMessage: 'You can only deposit to your own account',
                isSuccess: false,
                loggedInUser: req.session.user.name
            });
        }

        const exuser = await BankAccounts.findOne({ name: data.name });

        if (!exuser) {
            return res.status(404).render('depositamount', {
                errorMessage: 'Username does not exist',
                isSuccess: false,
                loggedInUser: req.session.user.name
            });
        }
        
        if (exuser.password !== data.password) {
            return res.status(404).render('depositamount', {
                errorMessage: 'Incorrect Password',
                loggedInUser: req.session.user.name
            });
        }
        
        if (isNaN(data.amount) || data.amount <= 0) {
            return res.status(400).render('depositamount', {
                errorMessage: 'Please enter a valid amount',
                isSuccess: false,
                loggedInUser: req.session.user.name
            });
        }
            
        exuser.Bank_Amount = parseFloat(exuser.Bank_Amount) + data.amount;
        await exuser.save();

        res.status(200).render('depositamount', {
            successMessage: 'Amount Deposited Successfully',
            isSuccess: true,
            loggedInUser: req.session.user.name
        });
        
    } catch (err) {
        res.status(500).render('depositamount', {
            errorMessage: 'Server Error: ' + err.message,
            isSuccess: false,
            loggedInUser: req.session.user.name
        });
    }
});
app.post('/withdrawamount', isAuthenticated, async (req, res) => {
    try {
        const data = {
            name: req.body.name,
            password: req.body.password,
            amount: parseFloat(req.body.amount),
        };
        if (data.name !== req.session.user.name) {
            return res.status(403).render('withdrawamount', {
                errorMessage: 'You can only withdraw from your own account',
                isSuccess: false,
                loggedInUser: req.session.user.name
            });
        }

        const exuser = await BankAccounts.findOne({name: data.name});
        
        if (!exuser) {
            return res.status(400).render('withdrawamount', {
                errorMessage: "Username does not exist",
                isSuccess: false,
                loggedInUser: req.session.user.name
            });
        }
        
        if (exuser.password !== data.password) {
            return res.status(404).render('withdrawamount', {
                errorMessage: 'Incorrect Password',
                loggedInUser: req.session.user.name
            });
        }
        
        
        if (isNaN(data.amount) || data.amount <= 0) {
            return res.status(400).render('withdrawamount', {
                errorMessage: 'Please enter a valid amount',
                isSuccess: false,
                loggedInUser: req.session.user.name
            });
        }
        
        if (exuser.Bank_Amount < data.amount) {
            return res.status(400).render('withdrawamount', {
                errorMessage: 'Insufficient Bank Balance',
                isSuccess: false,
                loggedInUser: req.session.user.name
            });
        }
        
        exuser.Bank_Amount -= data.amount;
        await exuser.save();
        
        return res.status(200).render('withdrawamount', {
            successMessage: 'Amount Withdrawn Successfully',
            loggedInUser: req.session.user.name
        });
    } catch (err) {
        console.log(err);
        return res.status(500).render('withdrawamount', {
            errorMessage: 'Server Error: ' + err.message,
            loggedInUser: req.session.user.name
        });
    }
});
app.post("/transferamount", isAuthenticated, async (req, res) => {
    try {
        const data = {
            yaccnum: req.body.yaccnum, 
            raccnum: req.body.raccnum, 
            amount: parseFloat(req.body.amount), 
        };
        const senderAccount = await BankAccounts.findOne({ accnum: data.yaccnum });
        
        if (!senderAccount) {
            return res.status(404).render('transferamount', {
                errorMessage: 'Sender Account Not Found',
                isSuccess: false,
                loggedInUser: req.session.user.name
            });
        }

        if (senderAccount.name !== req.session.user.name) {
            return res.status(403).render('transferamount', {
                errorMessage: 'You can only transfer from your own account',
                isSuccess: false,
                loggedInUser: req.session.user.name
            });
        }
        
        const receiverAccount = await BankAccounts.findOne({ accnum: data.raccnum });
        
        if (!receiverAccount) {
            return res.status(404).render('transferamount', {
                errorMessage: 'Receiver Account Not Found',
                isSuccess: false,
                loggedInUser: req.session.user.name
            });
        }


        if (isNaN(data.amount) || data.amount <= 0) {
            return res.status(400).render('transferamount', {
                errorMessage: 'Please enter a valid amount',
                isSuccess: false,
                loggedInUser: req.session.user.name
            });
        }

        if (senderAccount.Bank_Amount < data.amount) {
            return res.status(400).render('transferamount', {
                errorMessage: 'Insufficient Bank Balance',
                isSuccess: false,
                loggedInUser: req.session.user.name
            });
        }
        
        senderAccount.Bank_Amount = (parseFloat(senderAccount.Bank_Amount) || 0) - data.amount;
        receiverAccount.Bank_Amount = (parseFloat(receiverAccount.Bank_Amount) || 0) + data.amount;
        
        await senderAccount.save();
        await receiverAccount.save();

        return res.status(200).render('transferamount', {
            successMessage: 'Amount Transferred Successfully',
            isSuccess: true,
            loggedInUser: req.session.user.name
        });
    } catch (err) {
        console.error(err);
        return res.status(500).render('transferamount', {
            errorMessage: 'Server Error: ' + err.message,
            isSuccess: false,
            loggedInUser: req.session.user.name
        });
    }
});
app.post("/accdver", isAuthenticated, async (req, res) => {
    try {
        const { name, password } = req.body;
        
      
        if (name !== req.session.user.name) {
            return res.status(403).render("accdver", {
                errorMessage: "You can only access your own account details",
                loggedInUser: req.session.user.name
            });
        }
        
        const userAccount = await BankAccounts.findOne({ name });
        
        if (!userAccount) {
            return res.status(400).render("accdver", {
                errorMessage: "Username does not exist",
                loggedInUser: req.session.user.name
            });
        }
        
        if (userAccount.password !== password) {
            return res.status(400).render("accdver", {
                errorMessage: "Incorrect password",
                loggedInUser: req.session.user.name
            });
        }
        
        res.render("accountsdetails", { 
            account: userAccount,
            name: userAccount.name,
            accnum: userAccount.accnum,
            phno: userAccount.phno,
            ifsc: userAccount.ifsc,
            email: userAccount.email,
            Bank_Amount: userAccount.Bank_Amount,
            loggedInUser: req.session.user.name
        });

    } catch (error) {
        console.log("Account Verification Error:", error);
        res.status(500).render("accdver", {
            errorMessage: "Internal Server Error",
            loggedInUser: req.session.user.name
        });
    }
});


app.post("/accver", isAuthenticated, async (req, res) => {
    try {
        const { name, password } = req.body;
        
        // Verify the user is checking their own account
        if (name !== req.session.user.name) {
            return res.status(403).render("accver", {
                errorMessage: "You can only access your own account balance",
                loggedInUser: req.session.user.name
            });
        }
        
        const userAccount = await BankAccounts.findOne({ name });
        
        if (!userAccount) {
            return res.status(400).render("accver", {
                errorMessage: "Username does not exist",
                loggedInUser: req.session.user.name
            });
        }
        
        if (userAccount.password !== password) {
            return res.status(400).render("accver", {
                errorMessage: "Incorrect password",
                loggedInUser: req.session.user.name
            });
        }

        res.render("accountbalance", { 
            name: userAccount.name,
            accnum: userAccount.accnum,
            Bank_Amount: userAccount.Bank_Amount,
            loggedInUser: req.session.user.name
        });

    } catch (error) {
        console.log("Account Verification Error:", error);
        res.status(500).render("accver", {
            errorMessage: "Internal Server Error",
            loggedInUser: req.session.user.name
        });
    }
});

app.post("/anaver", isAuthenticated, async (req, res) => {
    try {
        const { name, password } = req.body;
        if (name !== req.session.user.name) {
            return res.status(403).render("anaver", {
                errorMessage: "You can only access your own analytics",
                loggedInUser: req.session.user.name
            });
        }
        
        const exuser = await BankAccounts.findOne({ name });
        
        if (!exuser) {
            return res.status(404).render("anaver", {
                errorMessage: "Username does not exist",
                loggedInUser: req.session.user.name
            });
        }
        
        if (String(exuser.password) !== String(password)) {
            return res.status(401).render("anaver", {
                errorMessage: "Incorrect password",
                loggedInUser: req.session.user.name
            });
        }
        
        return res.status(200).render("analytics", {
            loggedInUser: req.session.user.name
        });
    } catch (error) {
        console.error("Analytics Verification Error:", error);
        return res.status(500).render("anaver", {
            errorMessage: "Internal Server Error",
            loggedInUser: req.session.user.name
        });
    }
});

app.listen(3000, () => {
    console.log("Server Running At http://localhost:3000");
});                                                                    
