import { createClient, cacheExchange, fetchExchange } from "@urql/core"

const client = createClient({
    url: "https://api.studio.thegraph.com/query/81322/noc/v0.0.11",
    exchanges: [cacheExchange, fetchExchange],
})

export default client
