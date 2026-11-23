import { hcWithType } from 'altimatrix/client'

// The Vite proxy forwards same-origin API requests and adds the bearer token.
export const api = hcWithType('').api
