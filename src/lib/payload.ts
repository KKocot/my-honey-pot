import { getPayload, type Payload } from 'payload'
import config from '../payload/payload.config'

let payloadInstance: Payload | null = null

export async function getPayloadClient(): Promise<Payload> {
  if (payloadInstance) {
    return payloadInstance
  }

  payloadInstance = await getPayload({ config })
  return payloadInstance
}
