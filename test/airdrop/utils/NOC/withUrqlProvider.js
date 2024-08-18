// withUrqlProvider.js

import React from "react"
import { Provider } from "urql"
import client from "./urqlClientNOC"

const withUrqlProvider = (Component) => (props) =>
    (
        <Provider value={client}>
            <Component {...props} />
        </Provider>
    )

export default withUrqlProvider
