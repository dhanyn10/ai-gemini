const dotenv = require('dotenv')
const multer = require('multer')
const path = require('path')
const express = require('express')
const fs = require('fs')
const { GoogleGenerativeAI } = require('@google/generative-ai')
const mime = require('mime-types');

dotenv.config()

const app = express()
app.use(express.json())

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)
const model = genAI.getGenerativeModel({model: 'gemini-2.0-flash'})

const upload = multer({ dest: 'uploads/' })
const port = 3000
app.listen(port, () => {
    console.log(`Gemini API server is running on port ${port}`)
})

app.post('/generate-text', async (req, res) => {
    const { prompt } = req.body

    try{
        const result = await model.generateContent(prompt)
        const response = await result.response
        res.json({output: response.text()})
    } catch (error) {
        res.status(500).json({error: error.message})
    }
})

app.post('/generate-from-image', upload.single('image'), async (req, res) => {
    const prompt = req.body.prompt || 'describe the image'
    const image = req.file.path

    try{
        const imageBuffer = fs.readFileSync(image)
        const mimeType = req.file.mimetype

        const imagePart = {
            inlineData: {
                data: imageBuffer.toString('base64'),
                mimeType: mimeType
            }
        }

        const result = await model.generateContent([prompt, imagePart])
        const response = await result.response
        res.json({output: response.text()})
    } catch (error) {
        res.status(500).json({error: error.message})
    } finally {
        fs.unlinkSync(req.file.path)
    }
})

app.post('/generate-from-document', upload.single('document'), async (req, res) => {
    const filepath = req.file.path
    const buffer = fs.readFileSync(filepath)
    const base64Data = buffer.toString('base64')
    const mimeType = req.file.mimetype

    try{
        const documentPart = {
            inlineData: {
                data: base64Data,
                mimeType: mimeType
            }
        }

        const result = await model.generateContent(['analyze this document',documentPart])
        const response = await result.response
        res.json({output: response.text()})

    } catch (error) {
        res.status(500).json({error: error.message})
    } finally {
        fs.unlinkSync(req.file.path)
    }
})

app.post('/generate-from-audio', upload.single('audio'), async (req, res) => {
    const audioBuffer = fs.readFileSync(req.file.path)
    const base64Audio = audioBuffer.toString('base64')

    const audioPart = {
        inlineData: {
            data: base64Audio,
            mimeType: req.file.mimetype
        }
    }

    try{
        const result = await model.generateContent([
            'transcribe or analize the following audio: ', audioPart
        ])

        const response = await result.response
        res.json({output: response.text()})
    } catch (error) {
        res.status(500).json({error: error.message})
    } finally {
        fs.unlinkSync(req.file.path)
    }
})

// async function run() {
//     // const prompt = "write a story similar to cinderella"

//     const result = await model.generateContent(prompt)
//     const response = await result.response
//     const text = response.text()
//     console.log(text)

// }

// run()