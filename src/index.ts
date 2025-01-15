import {
    startUdpServer,
    useCache,
    useFallback,
    useZone
} from "denamed";


const queryHandler = (query: string) => {
    console.log("Received query:", query);
    return "Response to the query";
};
