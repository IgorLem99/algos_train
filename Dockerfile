# Образ веб-приложения: статический бинарник (контент и фронтенд встроены).
FROM golang:1.27-bookworm AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/algotrain .

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/algotrain /algotrain
USER nonroot:nonroot
ENV ADDR=:8080 LOG_FORMAT=json
EXPOSE 8080
ENTRYPOINT ["/algotrain"]
