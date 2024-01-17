// https://github.com/node-schedule/node-schedule
// mongoose.connect("mongodb://192.168.0.74:27017/nodeunifi");


// const pizzaSchema = new Schema({
//     title: String
// });
// const Pizza = model('pizza', pizzaSchema)
// async function createA() {
//     const article = new Pizza({
//         title: 'Awesome Post!2',
//       });
//       await article.save();
// }
// createA();
// const firstArticle = async () => {
//     const data = await Pizza.findOne({});
//     redLog(data)
// }
// firstArticle();


// const redis = require('redis');
// const client = redis.createClient();
// const client = redis.createClient({
//     host: 'your-redis-host',
//     port: 6379, // Default port
//     password: 'your-redis-password', // If required
//     db: 0 // Optional database number
//   });
// const client = redis.createClient('redis://username:password@example.com:6379/0');
// await client.connect();
// async function loadRedis() {
//     const client = await IORedis.createClient();
//     // await client.connect();
// }
// loadRedis();

// const connection = new IORedis('127.0.0.1:6379', {
//     maxRetriesPerRequest: null,
//     enableReadyCheck: false
// });
// // console.log(connection); // install redis to connect
// async function testing() {
//     const timer = async () => {
//         setTimeout(() => {
//             console.log('job 1 testinggggggg')
//         }, 5000)
//     }
//     await timer()
// }

// const myQueue = new Queue('TestingQ') // ,{} for specific connection
// async function addToQue() {
//     await myQueue.add('first job', testing())
//     // await myQueue.add('second job', { obj2: 2 })
// }
// async function addToQ() {
//     await addToQue();
// }
// addToQ();
// const worker = new Worker('TestingQ', async (job) => {
//     console.log(job.data)
// }, { connection });
// worker.on('completed', job => {
//     console.log(job.id, ' Completed');
// })


// const myQueue = new Queue('myqueue', { connection });
// const myWorker = new Worker('myqueue', async (job)=>{
//     redLog(job.data)
// }, { connection });
