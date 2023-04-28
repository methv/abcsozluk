//Written by Magabee -- instagram: @_._w2h_._ | Last update: 28.04.23 

const exp = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const { fb } = require('./config.js')
const app = exp()

const fs = require('fs')
app.use(exp.json())
app.use(cors())
app.use(exp.static('public'))
app.use(bodyParser.urlencoded({ extended: true }))

let userer

const rgx = /[^ .a-zA-Z0-9-]+/g

//html templates
const footer = `<footer><p>abcsözlük ©2023</p></footer>`
const header = `<header><div class="topleft"><a href="https://abcsozluk.up.railway.app/"><picture><source srcset="/asset/logo-small.png" media="(max-width: 620px)"><img src="/asset/logo-no-background.png"></picture></a></div><div><input id="aramafield" type="text" placeholder="başlık arayın..."></div></header><hr>`
const toggleform = `<button onclick="document.getElementById('id').classList.toggle('hidden')">Entry ekle</button>`
const addentry = `<div id="id" class="hidden"><textarea id="entry" placeholder="Entry"></textarea><button onclick="post('../../create', {title: document.title.split('-')[0].slice(0, -1), entry: document.getElementById('entry').value})">Ekle</button></div>`

//database stuff

const tt = fb.database().ref('titles')

let titles

tt.on('value', (ss) => {
	titles = ss.val()
})

//----//

app.get('/', async (req,res) => {
	//get logged user
	const user = fb.auth().currentUser
	res.locals.currentUser = user
	userer = user
	//check if user exists
	if(user){
		res.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="icon" href="/asset/logo-small.png" /><script src="/arama.js" defer></script><link rel="stylesheet" type="text/css" href="/style.css" /><title>abc sözlük.</title></head><body>${header}<div id="app">`)
		res.write(`<button><a href="/post">Entry veya başlık ekle.</a></button><h2>Tüm başlıklar.</h2><div class="titles">`)
		await fb.database().ref('titles').on('child_added', (t) => {
			const title = t.val()[Object.keys(t.val())[0]].title.trimStart(' ')
			res.write(`
				<p><a href="/b/${title.replace(rgx, '').replace(/[ .]/g, '-')}">${title}</a></p>
			`)
		})
		res.write(`</div></div>${footer}</body></html>`)
		res.end()
	}

	//otherwise redirect to register page
	else{
		res.redirect('/register')
	}

})

//handle entry creation
app.post('/create', async (req,res) => {
	const {title, entry} = req.body
	const tit = title.trimStart(' ')
	if(tit.replace(rgx, '') == '' || entry == ''){
		res.send('ERRORENTRY')
	}

	else if(!userer){
		//res.send('ERRORUSERAUTH')
		res.redirect('/login')
	}

	else{
		//solve regex
		const rtit = tit.replace(rgx, '')

		//add entry to database.
		const ref = fb.database().ref('titles/' + rtit)
		const res2 = await ref.push({
			title: title,
			entry: entry,
			date: new Date().getTime()
		})
		const dir = './public/b/' + rtit.replace(/[ .]/g, '-')

		//check if title was created, otherwise create a folder ant put added entry
		if (!fs.existsSync(dir)){
	    	await fs.mkdirSync(dir, {recursive: true})
	    	await fs.writeFileSync(dir+'/index.html', `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="icon" href="/asset/logo-small.png" /><script src="/arama.js" defer></script><script src="/addentry.js" defer></script><link rel="stylesheet" type="text/css" href="/style.css" /><title>${tit} - abcsözlük</title></head><body>${header}<div id="app"><h2>${tit}</h2>${toggleform}${addentry}`)
		}
		//put new entry to file
		await fs.appendFileSync(dir+'/index.html',`
			<div class="entry">
				<p>${entry}</p>
				<span class="author"><a href="/u/${userer.displayName}">${userer.displayName}</a></span>
				<span class="date">${new Date().toLocaleString('tr-TR', {timezone: 'Asia/Baku'}).slice(0,-3)}</span>
			</div>
		`)
		await res.redirect('/b/' + rtit.replace(/[ .]/g, '-'))
	}
})

//handle new user registration
app.post('/register', async (req,res) => {
	const {email, username, password} = req.body

	//if username contains unsupported characters, then send error code
	if(!/[A-Za-z].{2,17}/g.test(username)){
		res.send('<h1 style="text-align:center;font-family:sans-serif;font-size:min(5vw, 40px);">Kullanıcı adı geçersiz. Geri dönülüyor...</h1><script>setTimeout(() => history.back(), 2000)</script>')
	}
	else{
		fb.auth().createUserWithEmailAndPassword(email, password)
		.then(async (userCredential) => {
			//signed in
			userCredential.user.updateProfile({
				displayName: username
			})
			
			//create user page for registered user
			const dir = './public/u/' + username
			await fs.mkdirSync(dir, {recursive: true})
			await fs.writeFileSync(dir+'/index.html', `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="icon" href="/asset/logo-small.png" /><script src="/arama.js" defer></script><script src="/addentry.js" defer></script><link rel="stylesheet" type="text/css" href="/style.css" /><title>@${username} - abcsözlük</title></head><body>${header}<div id="app"><h2>${username}</h2><p>${userCredential.user.metadata.creationTime} tarihinde katıldı.</p></div></div>${footer}</body></html>`)
			//redirect user to main page
			res.redirect('/')
		}).catch(err => {
			//catch and show errors
			if(err.code == 'auth/email-already-in-use'){
				res.send(`<h1 style="text-align:center;font-family:sans-serif;font-size:min(5vw, 40px);">E posta başka bir hesapta kayıtlı. Geri dönülüyor...</h1><script>setTimeout(() => history.back(), 2000)</script>`)
			}
			else{
				res.send(`<h1 style="text-align:center;font-family:sans-serif;font-size:min(5vw, 40px);">Beklenmeyen hata. Geri dönülüyor...</h1><script>setTimeout(() => history.back(), 2000)</script>`)
			}
		})
	}
})

//handle user login
app.post('/login', async (req,res) => {
	const {email, password} = req.body
	fb.auth().signInWithEmailAndPassword(email, password)
	.then(async (userCredential) => {
	// Signed in
		//console.log(userCredential.user)
		res.redirect('/')
	}).catch(err => {
		//catch and show errors
		if(err.code == 'auth/user-not-found'){
			res.send(`<h1 style="text-align:center;font-family:sans-serif;font-size:min(5vw, 40px);">Kullanıcı bulunamadı. Geri dönülüyor...</h1><script>setTimeout(() => history.back(), 2000)</script>`)
		}
		else if(err.code == 'auth/wrong-password'){
			res.send(`<h1 style="text-align:center;font-family:sans-serif;font-size:min(5vw, 40px);">Yanlış şifre. Geri dönülüyor...</h1><script>setTimeout(() => history.back(), 2000)</script>`)
		}
		else{
			res.send(`<h1 style="text-align:center;font-family:sans-serif;font-size:min(5vw, 40px);">Beklenmeyen hata.</h1><script>setTimeout(() => history.back(), 2000)</script>`)
		}
	})
	
})

//handle user logout
app.get('/logout', (req,res) => {
	fb.auth().signOut().then(() => {
		res.redirect('/login')
	})
})

//The 404 Route (ALWAYS Keep this as the last route)
/*app.get('*', function(req, res){
	res.status(404).sendFile('/public/404.html', {root: __dirname});
})*/

app.listen(process.env.PORT || 3000, () => console.log('Running on PORT'))	