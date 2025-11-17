#!/bin/bash
npx eslint packages/* --ext .js,.ts --fix
npx prettier --write .
echo "Lint & format complete!"