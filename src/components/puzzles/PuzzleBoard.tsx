import {
  ActionIcon,
  AspectRatio,
  Box,
  Modal,
  SimpleGrid,
  Stack,
  createStyles,
} from "@mantine/core";
import { useViewportSize } from "@mantine/hooks";
import {
  IconChessBishop,
  IconChessKnight,
  IconChessQueen,
  IconChessRook,
} from "@tabler/icons-react";
import { BISHOP, Chess, KNIGHT, Move, QUEEN, ROOK, Square } from "chess.js";
import { useState } from "react";
import Chessground from "react-chessground";
import {
  formatMove,
  handleMove,
  moveToKey,
  parseUci,
  toDests,
} from "../../utils/chess";
import { Completion, Puzzle } from "../../utils/puzzles";

const useStyles = createStyles(() => ({
  chessboard: {
    position: "relative",
    marginRight: "auto",
    marginLeft: "auto",
    zIndex: 1,
  },
}));

const promotionPieces = [
  {
    piece: QUEEN,
    icon: <IconChessQueen size={50} />,
  },

  {
    piece: ROOK,
    icon: <IconChessRook size={50} />,
  },

  {
    piece: KNIGHT,
    icon: <IconChessKnight size={50} />,
  },

  {
    piece: BISHOP,
    icon: <IconChessBishop size={50} />,
  },
];

function PuzzleBoard({
  puzzles,
  currentPuzzle,
  changeCompletion,
  generatePuzzle,
  setCurrentPuzzle,
  currentMove,
  setCurrentMove,
  db,
}: {
  puzzles: Puzzle[];
  currentPuzzle: number;
  changeCompletion: (completion: Completion) => void;
  generatePuzzle: (db: string) => void;
  setCurrentPuzzle: (currentPuzzle: number) => void;
  currentMove: number;
  setCurrentMove: (currentMove: number) => void;
  db: string;
}) {
  const puzzle = puzzles[currentPuzzle];
  const [ended, setEnded] = useState(false);
  const chess = new Chess(puzzle.fen);
  let lastMove: Move;
  let orientation: "white" | "black" = "white";
  for (let i = 0; i < Math.min(currentMove, puzzle.moves.length); i++) {
    lastMove = chess.move(parseUci(puzzle.moves[i]));
    if (i == 0) {
      orientation = formatMove(chess.turn());
    }
  }
  const [pendingMove, setPendingMove] = useState<{
    from: Square;
    to: Square;
  } | null>(null);
  const dests = toDests(chess, false);
  const fen = chess.fen();
  const turn = formatMove(chess.turn());

  const { height, width } = useViewportSize();

  function getBoardSize(height: number, width: number) {
    const initial = Math.min((height - 140) * 0.95, width * 0.4);
    if (width < 680) {
      return width - 120;
    }
    return initial;
  }
  const boardSize = getBoardSize(height, width);

  const { classes } = useStyles();

  return (
    <Stack justify="center">
      <Modal
        opened={pendingMove !== null}
        onClose={() => setPendingMove(null)}
        withCloseButton={false}
        size={375}
      >
        <SimpleGrid cols={2}>
          {promotionPieces.map((p) => (
            <Box key={p.piece} sx={{ width: "100%", height: "100%" }}>
              <AspectRatio ratio={1}>
                <ActionIcon
                  onClick={() => {
                    if (
                      puzzle.moves[currentMove] ===
                      `${pendingMove?.from}${pendingMove?.to}${p.piece}`
                    ) {
                      chess.move({
                        from: pendingMove!.from,
                        to: pendingMove!.to,
                        promotion: p.piece,
                      });
                      if (currentMove === puzzle.moves.length) {
                        if (puzzle.completion !== Completion.INCORRECT) {
                          changeCompletion(Completion.CORRECT);
                        }
                        setCurrentMove(1);
                        setEnded(false);

                        generatePuzzle(db);
                      }
                      setCurrentMove(currentMove + 2);
                    } else {
                      if (!ended) {
                        changeCompletion(Completion.INCORRECT);
                      }
                      setEnded(true);
                    }
                    setPendingMove(null);
                  }}
                >
                  {p.icon}
                </ActionIcon>
              </AspectRatio>
            </Box>
          ))}
        </SimpleGrid>
      </Modal>
      <Box className={classes.chessboard}>
        <Chessground
          animation={{
            enabled: true,
          }}
          style={{ justifyContent: "start" }}
          width={boardSize}
          height={boardSize}
          orientation={orientation}
          movable={{
            free: false,
            color: turn,
            dests: dests,
            events: {
              after: (orig, dest, metadata) => {
                let newDest = handleMove(chess, orig, dest)!;
                // handle promotions
                if (
                  chess.get(orig as Square).type === "p" &&
                  ((newDest[1] === "8" && turn === "white") ||
                    (newDest[1] === "1" && turn === "black"))
                ) {
                  setPendingMove({ from: orig as Square, to: newDest });
                } else {
                  console.log(puzzle.moves[currentMove]);
                  if (puzzle.moves[currentMove] === `${orig}${newDest}`) {
                    console.log("correct move", currentMove);
                    if (currentMove === puzzle.moves.length - 1) {
                      console.log("last move");
                      if (puzzle.completion !== Completion.INCORRECT) {
                        changeCompletion(Completion.CORRECT);
                      }
                      setEnded(false);

                      generatePuzzle(db);
                    }
                    setCurrentMove(currentMove + 2);
                  } else {
                    if (!ended) {
                      changeCompletion(Completion.INCORRECT);
                    }
                    setEnded(true);
                  }
                  // makeMove({
                  //   from: orig as Square,
                  //   to: newDest,
                  // });
                }
              },
            },
          }}
          lastMove={moveToKey(lastMove!)}
          turnColor={turn}
          fen={fen}
          check={chess.inCheck()}
        />
      </Box>
    </Stack>
  );
}

export default PuzzleBoard;
