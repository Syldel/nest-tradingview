#!/bin/bash

curl -X POST http://localhost:3003/web-scraper/strategy-data -H "Content-Type: application/json" -d "{\"symbol\":\"XRPUSDT\",\"exchange\":\"KUCOIN\",\"interval\":\"120\",\"strategyTitle\":\"Machine Learning: Lorentzian Classification\",\"shortStrategyTitle\":\"Lorentzian Classification\"}"
