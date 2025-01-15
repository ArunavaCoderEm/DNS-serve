import { startUdpServer, DnsQueryMessage } from "denamed";

type QueryHandler = (query: DnsQueryMessage) => any;

