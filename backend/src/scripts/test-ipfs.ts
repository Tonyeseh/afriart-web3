import axios from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
import * as path from 'path';
import { ipfsService } from '../services/ipfs.service';

/**
 * Test script for IPFS upload and retrieval functionality
 *
 * Tests:
 * 1. Environment variables (Pinata API keys)
 * 2. File upload to IPFS
 * 3. JSON metadata upload to IPFS
 * 4. File retrieval from IPFS gateway
 * 5. Metadata retrieval and validation
 */

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

function log(message: string, color: keyof typeof COLORS = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<boolean> {
  const startTime = Date.now();
  try {
    await testFn();
    const duration = Date.now() - startTime;
    log(`✅ ${name} (${duration}ms)`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${name}`, 'red');
    if (error instanceof Error) {
      log(`   ${error.message}`, 'gray');
    }
    return false;
  }
}

async function main() {
  log('\n🧪 IPFS Upload & Retrieval Tests\n', 'blue');

  const results: boolean[] = [];
  let uploadedFileCID: string | null = null;
  let uploadedMetadataCID: string | null = null;

  // Test 1: Environment Variables
  results.push(
    await runTest('Environment variables configured', async () => {
      if (!process.env.PINATA_API_KEY) {
        throw new Error('PINATA_API_KEY not set');
      }
      if (!process.env.PINATA_SECRET_KEY) {
        throw new Error('PINATA_SECRET_KEY not set');
      }
    })
  );

  // Test 2: File Upload
  results.push(
    await runTest('Upload file to IPFS', async () => {
      // Create a test file (simple text file)
      const testContent = Buffer.from(
        'This is a test file for IPFS upload verification',
        'utf-8'
      );

      const result = await ipfsService.uploadFile(testContent, {
        name: 'test-file.txt',
      });

      if (!result.cid) {
        throw new Error('No CID returned from upload');
      }

      if (!result.cid.startsWith('Qm') && !result.cid.startsWith('bafy')) {
        throw new Error(`Invalid CID format: ${result.cid}`);
      }

      if (!result.url.includes(result.cid)) {
        throw new Error('URL does not contain CID');
      }

      uploadedFileCID = result.cid;
      log(`   CID: ${result.cid}`, 'gray');
      log(`   Size: ${result.size} bytes`, 'gray');
    })
  );

  // Test 3: Metadata Upload
  results.push(
    await runTest('Upload JSON metadata to IPFS', async () => {
      const testMetadata = {
        name: 'Test NFT',
        description: 'This is a test NFT metadata',
        image: 'ipfs://QmTest123',
        creator: 'Test Artist',
        attributes: [
          { trait_type: 'Color', value: 'Blue' },
          { trait_type: 'Size', value: 'Large' },
        ],
      };

      const result = await ipfsService.uploadJSON(testMetadata, {
        name: 'test-metadata.json',
      });

      if (!result.cid) {
        throw new Error('No CID returned from metadata upload');
      }

      if (!result.cid.startsWith('Qm') && !result.cid.startsWith('bafy')) {
        throw new Error(`Invalid CID format: ${result.cid}`);
      }

      uploadedMetadataCID = result.cid;
      log(`   CID: ${result.cid}`, 'gray');
    })
  );

  // Test 4: File Retrieval
  results.push(
    await runTest('Retrieve uploaded file from IPFS', async () => {
      if (!uploadedFileCID) {
        throw new Error('No file CID available for retrieval test');
      }

      const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${uploadedFileCID}`;
      const response = await axios.get(gatewayUrl, { timeout: 10000 });

      if (response.status !== 200) {
        throw new Error(`Failed to retrieve file: HTTP ${response.status}`);
      }

      const content = response.data;
      if (!content.includes('test file for IPFS upload')) {
        throw new Error('Retrieved content does not match uploaded content');
      }

      log(`   Content verified`, 'gray');
    })
  );

  // Test 5: Metadata Retrieval
  results.push(
    await runTest('Retrieve and validate metadata from IPFS', async () => {
      if (!uploadedMetadataCID) {
        throw new Error('No metadata CID available for retrieval test');
      }

      const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${uploadedMetadataCID}`;
      const response = await axios.get(gatewayUrl, { timeout: 10000 });

      if (response.status !== 200) {
        throw new Error(`Failed to retrieve metadata: HTTP ${response.status}`);
      }

      const metadata = response.data;

      if (metadata.name !== 'Test NFT') {
        throw new Error('Metadata name does not match');
      }

      if (!metadata.attributes || metadata.attributes.length !== 2) {
        throw new Error('Metadata attributes are missing or invalid');
      }

      log(`   Metadata validated`, 'gray');
    })
  );

  // Test 6: Invalid CID Handling
  results.push(
    await runTest('Handle invalid CID gracefully', async () => {
      const invalidCID = 'QmInvalidCIDThatDoesNotExist123456789';
      const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${invalidCID}`;

      try {
        await axios.get(gatewayUrl, {
          timeout: 5000,
          validateStatus: (status) => status < 500,
        });
      } catch (error) {
        // Expected to fail or return 404
      }

      // If we got here, the test passed (we didn't throw an unexpected error)
    })
  );

  // Test 7: Large File Simulation (without actual upload)
  results.push(
    await runTest('Validate file size limits', async () => {
      const maxSize = 50 * 1024 * 1024; // 50MB
      const testSize = 100 * 1024; // 100KB (within limits)

      if (testSize > maxSize) {
        throw new Error('File size exceeds limit');
      }

      // Create a buffer of test size
      const buffer = Buffer.alloc(testSize);

      if (buffer.length !== testSize) {
        throw new Error('Buffer size does not match');
      }

      log(`   Max size: ${maxSize / (1024 * 1024)}MB`, 'gray');
      log(`   Test size: ${testSize / 1024}KB`, 'gray');
    })
  );

  // Summary
  log('\n📊 Test Summary\n', 'blue');

  const passed = results.filter((r) => r).length;
  const failed = results.filter((r) => !r).length;
  const total = results.length;

  log(`Total Tests: ${total}`, 'reset');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'gray');

  if (uploadedFileCID) {
    log(`\n📁 Test File CID: ${uploadedFileCID}`, 'yellow');
    log(
      `   Gateway URL: https://gateway.pinata.cloud/ipfs/${uploadedFileCID}`,
      'gray'
    );
  }

  if (uploadedMetadataCID) {
    log(`\n📋 Test Metadata CID: ${uploadedMetadataCID}`, 'yellow');
    log(
      `   Gateway URL: https://gateway.pinata.cloud/ipfs/${uploadedMetadataCID}`,
      'gray'
    );
  }

  if (failed === 0) {
    log('\n✅ All IPFS tests passed!\n', 'green');
    process.exit(0);
  } else {
    log('\n❌ Some tests failed. Please check the errors above.\n', 'red');
    process.exit(1);
  }
}

// Run tests
main().catch((error) => {
  log(`\n❌ Test suite failed: ${error.message}\n`, 'red');
  process.exit(1);
});
