# Identity Reconciliation 

* Hosted link to test from postman https://sparkleworldstudio.com/identify

web service with an endpoint /identify that will receive HTTP POST requests with JSON body of the following format:
```js
{
	"email": string,
	"phoneNumber": number
}
```
and return a response of JOSN body as the following format:

```js
{
		"contact":{
			"primaryContatctId": number,
			"emails": string[], // first element being email of primary contact 
			"phoneNumbers": string[], // first element being phoneNumber of primary contact
			"secondaryContactIds": number[] // Array of all Contact IDs that are "secondary" to the primary contact
		}
	}
```

### setup
#### pre requisite
-  start a postgress db localy or get a postgress db from [supabase](https://supabase.com/) ,[aiven](https://aiven.io/) or any alternative you know. Change the DATABASE_URL with your DATABASE_URL

* Install dependencies. 
```
npm install
```

* push prisma schema to db. 
```
npx prisma db push
```

* Generate prisma schema. 
```
npx prisma generate
```

* start the server in dev mode
```
npm run dev
```
* start the server in prod mode
```
npm run build
npm run start
```
* This will start you server on http://localhost:8080