import {
  ApolloClient,
  ApolloProvider,
  HttpLink,
  InMemoryCache,
  gql,
  useQuery,
} from "@apollo/client";

const createApolloClient = (initialState = undefined) => {
  const ssrMode = typeof window === "undefined";
  const client = new ApolloClient({
    ssrMode,
    cache: new InMemoryCache({
      typePolicies: {
        User: {
          keyFields: ["foo"], // this is the reason our server crashes
        },
      },
    }).restore(initialState || {}),
    link: new HttpLink({
      uri: "https://gitlab.com/api/graphql",
    }),
  });
  return client;
};

let cachedClient = undefined;

const initApolloClient = (initialState = undefined) => {
  if (typeof window === "undefined") {
    return createApolloClient(initialState);
  }
  if (!cachedClient) {
    cachedClient = createApolloClient(initialState);
  }
  return cachedClient;
};

// this is just an example query to a public GraphQL API
const QUERY = gql`
  query Foo {
    user(username: "berekuk") {
      id
    }
  }
`;

const Inner = () => {
  const queryResults = useQuery(QUERY);
  return (
    <div>
      <div>data: {JSON.stringify(queryResults.data)}</div>
      <div>Error: {JSON.stringify(queryResults.error)}</div>
    </div>
  );
};

const Home = () => {
  const client = initApolloClient();

  return (
    <ApolloProvider client={client}>
      <Inner />
    </ApolloProvider>
  );
};

Home.getInitialProps = async (ctx) => {
  const { AppTree } = ctx;
  const apolloClient = initApolloClient();

  const { getDataFromTree } = await import("@apollo/client/react/ssr");

  try {
    await getDataFromTree(
      <AppTree
        pageProps={{
          apolloClient,
        }}
      />
    );
  } catch (e) {
    console.error("Caught an error, failure prevented?.. Probably not");
  }
  return {};
};

export default Home;
