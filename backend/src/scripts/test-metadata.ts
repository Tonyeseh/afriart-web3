import { metadataService } from '../services/metadata.service';
import { ipfsService } from '../services/ipfs.service';

/**
 * Test script for HIP-412 metadata generation and structure
 *
 * Tests:
 * 1. HIP-412 metadata structure generation
 * 2. Required fields validation
 * 3. Optional fields handling
 * 4. IPFS upload of metadata
 * 5. Metadata retrieval and validation
 *
 * Run: pnpm metadata:test
 */

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
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
  log('\n🧪 HIP-412 Metadata Tests\n', 'blue');

  const results: boolean[] = [];
  let generatedMetadata: any = null;
  let uploadedCID: string | null = null;

  // Test 1: Basic Metadata Generation
  results.push(
    await runTest('Generate basic HIP-412 metadata', async () => {
      const metadata = metadataService.generateHIP412Metadata({
        name: 'Sunset in Lagos',
        description: 'A beautiful digital painting capturing the vibrant sunset over Lagos city',
        creator: 'Kwame Mensah',
        imageUrl: 'https://gateway.pinata.cloud/ipfs/QmTest123',
        imageCid: 'QmTest123',
      });

      if (!metadata.name) {
        throw new Error('Metadata missing required field: name');
      }

      if (!metadata.creator) {
        throw new Error('Metadata missing required field: creator');
      }

      if (!metadata.description) {
        throw new Error('Metadata missing required field: description');
      }

      if (!metadata.image) {
        throw new Error('Metadata missing required field: image');
      }

      generatedMetadata = metadata;
      log(`   Name: ${metadata.name}`, 'gray');
      log(`   Creator: ${metadata.creator}`, 'gray');
    })
  );

  // Test 2: Metadata with Optional Fields
  results.push(
    await runTest('Generate metadata with optional fields', async () => {
      const metadata = metadataService.generateHIP412Metadata({
        name: 'African Mask',
        description: 'Traditional African mask artwork',
        creator: 'Amara Okonkwo',
        creatorDID: 'did:hedera:testnet:0.0.12345',
        imageUrl: 'ipfs://QmTest456',
        imageCid: 'QmTest456',
        technique: 'Oil Painting',
        material: 'Canvas',
        dimensions: '50x70cm',
        yearCreated: '2024',
        country: 'Nigeria',
      });

      if (!metadata.properties) {
        throw new Error('Metadata missing properties object');
      }

      if (metadata.properties.technique !== 'Oil Painting') {
        throw new Error('Technique not set correctly');
      }

      if (metadata.properties.country !== 'Nigeria') {
        throw new Error('Country not set correctly');
      }

      if (!metadata.creatorDID) {
        throw new Error('CreatorDID not set');
      }

      log(`   Technique: ${metadata.properties.technique}`, 'gray');
      log(`   Country: ${metadata.properties.country}`, 'gray');
    })
  );

  // Test 3: Files Array Structure
  results.push(
    await runTest('Validate files array structure', async () => {
      if (!generatedMetadata) {
        throw new Error('No metadata generated yet');
      }

      if (!Array.isArray(generatedMetadata.files)) {
        throw new Error('Files field is not an array');
      }

      if (generatedMetadata.files.length === 0) {
        throw new Error('Files array is empty');
      }

      const file = generatedMetadata.files[0];

      if (!file.uri) {
        throw new Error('File missing uri field');
      }

      if (!file.type) {
        throw new Error('File missing type field');
      }

      if (!file.metadata || !file.metadata.cid) {
        throw new Error('File missing metadata.cid field');
      }

      log(`   Files count: ${generatedMetadata.files.length}`, 'gray');
      log(`   File URI: ${file.uri}`, 'gray');
    })
  );

  // Test 4: Attributes Array Structure
  results.push(
    await runTest('Validate attributes array structure', async () => {
      if (!generatedMetadata) {
        throw new Error('No metadata generated yet');
      }

      if (!Array.isArray(generatedMetadata.attributes)) {
        throw new Error('Attributes field is not an array');
      }

      if (generatedMetadata.attributes.length === 0) {
        throw new Error('Attributes array is empty');
      }

      const attr = generatedMetadata.attributes[0];

      if (!attr.trait_type) {
        throw new Error('Attribute missing trait_type field');
      }

      if (!attr.value) {
        throw new Error('Attribute missing value field');
      }

      log(`   Attributes count: ${generatedMetadata.attributes.length}`, 'gray');
    })
  );

  // Test 5: Upload Metadata to IPFS
  results.push(
    await runTest('Upload metadata to IPFS', async () => {
      if (!generatedMetadata) {
        throw new Error('No metadata generated yet');
      }

      const result = await ipfsService.uploadJSON(generatedMetadata, {
        name: 'test-metadata.json',
      });

      if (!result.cid) {
        throw new Error('No CID returned from IPFS upload');
      }

      if (!result.cid.startsWith('Qm') && !result.cid.startsWith('bafy')) {
        throw new Error(`Invalid CID format: ${result.cid}`);
      }

      uploadedCID = result.cid;
      log(`   CID: ${result.cid}`, 'gray');
      log(`   URL: ${result.url}`, 'gray');
    })
  );

  // Test 6: Retrieve and Validate Metadata
  results.push(
    await runTest('Retrieve and validate uploaded metadata', async () => {
      if (!uploadedCID) {
        throw new Error('No CID available for retrieval');
      }

      const axios = require('axios');
      const url = `https://gateway.pinata.cloud/ipfs/${uploadedCID}`;
      const response = await axios.get(url, { timeout: 10000 });

      if (response.status !== 200) {
        throw new Error(`Failed to retrieve metadata: HTTP ${response.status}`);
      }

      const metadata = response.data;

      // Validate HIP-412 structure
      const requiredFields = ['name', 'creator', 'description', 'image', 'type'];
      for (const field of requiredFields) {
        if (!metadata[field]) {
          throw new Error(`Retrieved metadata missing required field: ${field}`);
        }
      }

      if (!Array.isArray(metadata.files)) {
        throw new Error('Retrieved metadata.files is not an array');
      }

      if (!Array.isArray(metadata.attributes)) {
        throw new Error('Retrieved metadata.attributes is not an array');
      }

      log(`   Metadata validated successfully`, 'gray');
    })
  );

  // Test 7: JSON Serialization
  results.push(
    await runTest('Validate JSON serialization', async () => {
      if (!generatedMetadata) {
        throw new Error('No metadata generated yet');
      }

      const jsonString = JSON.stringify(generatedMetadata, null, 2);

      if (!jsonString) {
        throw new Error('Failed to serialize metadata to JSON');
      }

      const parsed = JSON.parse(jsonString);

      if (parsed.name !== generatedMetadata.name) {
        throw new Error('Metadata name changed after serialization');
      }

      log(`   JSON size: ${jsonString.length} bytes`, 'gray');
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

  // Display sample metadata
  if (generatedMetadata) {
    log('\n📋 Sample HIP-412 Metadata Structure:\n', 'cyan');
    log(JSON.stringify(generatedMetadata, null, 2), 'gray');
  }

  if (uploadedCID) {
    log(`\n🔗 Uploaded Metadata CID: ${uploadedCID}`, 'yellow');
    log(
      `   Gateway URL: https://gateway.pinata.cloud/ipfs/${uploadedCID}`,
      'gray'
    );
  }

  // HIP-412 Spec Reference
  log('\n📚 HIP-412 Specification Reference:\n', 'blue');
  log('   Standard: https://hips.hedera.com/hip/hip-412', 'cyan');
  log('   Required fields: name, creator, description, image, type', 'gray');
  log('   Optional fields: creatorDID, properties, files, attributes', 'gray');
  log('   Localization: supported via localization object', 'gray');
  log('   Files: array of file objects with uri, type, and metadata', 'gray');
  log('   Attributes: array of trait objects with trait_type and value', 'gray');

  if (failed === 0) {
    log('\n✅ All HIP-412 metadata tests passed!\n', 'green');
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
