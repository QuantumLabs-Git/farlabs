#!/usr/bin/env python3
"""
Far Node Server - Entry Point

GPU provider client software for earning $FAR tokens by serving
distributed inference on the Far Mesh network.
"""

import sys
import os

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import and run the node server
from node_server import main
import asyncio

if __name__ == "__main__":
    print("=" * 60)
    print("Far Node Server - Starting...")
    print("=" * 60)
    print("")

    # Run the main async function
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\nShutdown requested by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n\nFatal error: {e}")
        sys.exit(1)
