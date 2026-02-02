#!/bin/bash

# ColorBot Query Logs Export Script
# Exports query logs from DynamoDB for review

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

TABLE_NAME="colorbot-query-logs"

show_help() {
  echo "ColorBot Query Logs Export Tool"
  echo ""
  echo "Usage: $0 [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  --all              Export all logs"
  echo "  --rejected         Export only rejected (moderation failed) requests"
  echo "  --approved         Export only approved requests"
  echo "  --today            Export only today's logs"
  echo "  --last-week        Export logs from the last 7 days"
  echo "  --json             Output as raw JSON (default is formatted table)"
  echo "  --csv              Output as CSV"
  echo "  --output FILE      Save to file instead of stdout"
  echo "  --help             Show this help message"
  echo ""
  echo "Examples:"
  echo "  $0 --all --json                    # All logs as JSON"
  echo "  $0 --rejected --csv --output rej.csv  # Rejected requests to CSV"
  echo "  $0 --today                         # Today's logs as table"
}

# Default values
FILTER=""
FORMAT="table"
OUTPUT_FILE=""
DATE_FILTER=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --all)
      FILTER="all"
      shift
      ;;
    --rejected)
      FILTER="rejected"
      shift
      ;;
    --approved)
      FILTER="approved"
      shift
      ;;
    --today)
      DATE_FILTER="today"
      shift
      ;;
    --last-week)
      DATE_FILTER="week"
      shift
      ;;
    --json)
      FORMAT="json"
      shift
      ;;
    --csv)
      FORMAT="csv"
      shift
      ;;
    --output)
      OUTPUT_FILE="$2"
      shift 2
      ;;
    --help)
      show_help
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

# Default to all if no filter specified
if [ -z "$FILTER" ]; then
  FILTER="all"
fi

echo -e "${BLUE}Exporting ColorBot query logs...${NC}" >&2

# Build scan command
SCAN_CMD="aws dynamodb scan --table-name $TABLE_NAME"

# Add filter for approved/rejected
if [ "$FILTER" = "rejected" ]; then
  SCAN_CMD="$SCAN_CMD --filter-expression 'approved = :val' --expression-attribute-values '{\":val\":{\"BOOL\":false}}'"
elif [ "$FILTER" = "approved" ]; then
  SCAN_CMD="$SCAN_CMD --filter-expression 'approved = :val' --expression-attribute-values '{\":val\":{\"BOOL\":true}}'"
fi

# Execute scan
RESULT=$(eval $SCAN_CMD 2>/dev/null)

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to scan DynamoDB table. Check your AWS credentials.${NC}" >&2
  exit 1
fi

# Check if we have results
ITEM_COUNT=$(echo "$RESULT" | jq '.Count')
echo -e "${GREEN}Found $ITEM_COUNT log entries${NC}" >&2

if [ "$ITEM_COUNT" = "0" ]; then
  echo "No logs found matching criteria."
  exit 0
fi

# Process based on format
case $FORMAT in
  json)
    # Convert DynamoDB format to regular JSON
    OUTPUT=$(echo "$RESULT" | jq '[.Items[] | {
      requestId: .requestId.S,
      timestamp: .timestamp.S,
      originalUtterance: .originalUtterance.S,
      locale: .locale.S,
      approved: .approved.BOOL,
      moderationNotes: .moderationNotes.S,
      subjects: [.subjects.L[]?.S] // [],
      refinedPrompt: .refinedPrompt.S,
      status: .status.S,
      imageUrl: .imageUrl.S // null,
      error: .error.S // null,
      completedAt: .completedAt.S // null
    }] | sort_by(.timestamp) | reverse')

    # Apply date filter
    if [ "$DATE_FILTER" = "today" ]; then
      TODAY=$(date -u +%Y-%m-%d)
      OUTPUT=$(echo "$OUTPUT" | jq --arg today "$TODAY" '[.[] | select(.timestamp | startswith($today))]')
    elif [ "$DATE_FILTER" = "week" ]; then
      WEEK_AGO=$(date -u -v-7d +%Y-%m-%dT%H:%M:%S 2>/dev/null || date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%S)
      OUTPUT=$(echo "$OUTPUT" | jq --arg week "$WEEK_AGO" '[.[] | select(.timestamp >= $week)]')
    fi
    ;;

  csv)
    # Convert to CSV
    OUTPUT=$(echo "$RESULT" | jq -r '.Items[] | [
      .requestId.S,
      .timestamp.S,
      .originalUtterance.S,
      .locale.S,
      (.approved.BOOL | tostring),
      .moderationNotes.S,
      ([.subjects.L[]?.S] | join(";")),
      .status.S
    ] | @csv' | sort -t',' -k2 -r)

    # Add header
    OUTPUT="requestId,timestamp,originalUtterance,locale,approved,moderationNotes,subjects,status
$OUTPUT"
    ;;

  table)
    # Format as readable table
    echo ""
    echo "=== ColorBot Query Logs ==="
    echo ""

    OUTPUT=$(echo "$RESULT" | jq -r '.Items | sort_by(.timestamp.S) | reverse | .[] |
      "----------------------------------------\n" +
      "Request ID: \(.requestId.S)\n" +
      "Time: \(.timestamp.S)\n" +
      "Utterance: \(.originalUtterance.S)\n" +
      "Approved: \(.approved.BOOL)\n" +
      "Moderation: \(.moderationNotes.S)\n" +
      "Status: \(.status.S)\n" +
      (if .imageUrl.S then "Image: \(.imageUrl.S)\n" else "" end) +
      (if .error.S then "Error: \(.error.S)\n" else "" end)')
    ;;
esac

# Output result
if [ -n "$OUTPUT_FILE" ]; then
  echo "$OUTPUT" > "$OUTPUT_FILE"
  echo -e "${GREEN}Exported to: $OUTPUT_FILE${NC}" >&2
else
  echo "$OUTPUT"
fi
