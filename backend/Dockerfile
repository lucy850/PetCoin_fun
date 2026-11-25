FROM golang:1.23-alpine AS build

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/petcoin-ws .

FROM alpine:3.21

RUN apk add --no-cache ca-certificates
COPY --from=build /out/petcoin-ws /usr/local/bin/petcoin-ws

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["petcoin-ws"]
