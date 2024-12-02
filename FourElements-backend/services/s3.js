// const {S3} = require('@aws-sdk/client-s3')
import {S3} from '@aws-sdk/client-s3'
const s3 = new S3({region: process.env.AWS_REGION})

export default {s3}