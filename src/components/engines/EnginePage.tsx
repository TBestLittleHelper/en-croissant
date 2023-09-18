import {
  ActionIcon,
  Button,
  Group,
  Image,
  ScrollArea,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { IconEdit, IconPlus, IconRobot, IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Engine } from "@/utils/engines";
import { useLocalFile } from "@/utils/misc";
import OpenFolderButton from "../common/OpenFolderButton";
import AddEngine from "./AddEngine";
import { useToggle } from "@mantine/hooks";
import ConfirmModal from "../common/ConfirmModal";
import EditEngine from "./EditEngine";
import { exists } from "@tauri-apps/api/fs";

export default function EnginePage() {
  const [engines, setEngines] = useLocalFile<Engine[]>(
    "engines/engines.json",
    []
  );
  const [opened, setOpened] = useState(false);

  return (
    <>
      <AddEngine
        engines={engines}
        opened={opened}
        setOpened={setOpened}
        setEngines={setEngines}
      />
      <Group align="baseline" ml="lg" mt="xl">
        <Title>Your Engines</Title>
        <OpenFolderButton base="AppDir" folder="engines" />
      </Group>
      <ScrollArea>
        <Table sx={{ minWidth: 800 }} verticalSpacing="sm">
          <thead>
            <tr>
              <th>Engine</th>
              <th>Elo</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {engines &&
              engines.map((item) => (
                <EngineRow
                  key={item.path}
                  item={item}
                  setEngines={setEngines}
                  engines={engines}
                />
              ))}
            <tr>
              <td>
                <Button
                  onClick={() => setOpened(true)}
                  variant="default"
                  rightIcon={<IconPlus size={14} />}
                >
                  Add new
                </Button>
              </td>
            </tr>
          </tbody>
        </Table>
      </ScrollArea>
    </>
  );
}

function EngineRow({
  item,
  engines,
  setEngines,
}: {
  item: Engine;
  engines: Engine[];
  setEngines: React.Dispatch<React.SetStateAction<Engine[]>>;
}) {
  const [deleteModal, toggleDeleteModal] = useToggle();
  const [editModal, toggleEditModal] = useToggle();

  const [fileExists, setFileExists] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      setFileExists(await exists(item.path));
    })();
  }, [item.path]);

  return (
    <>
      <ConfirmModal
        title={"Remove engine"}
        description={`Are you sure you want to remove "${item.name}"?`}
        opened={deleteModal}
        onClose={toggleDeleteModal}
        onConfirm={() =>
          setEngines((prev) => prev.filter((e) => e.name !== item.name))
        }
      />
      <EditEngine
        opened={editModal}
        setOpened={toggleEditModal}
        engines={engines}
        setEngines={setEngines}
        initialEngine={item}
      />

      <tr>
        <td>
          <Group spacing="sm">
            {item.image ? (
              <Image width={60} height={60} src={item.image} />
            ) : (
              <IconRobot size={60} />
            )}
            <Text size="md" weight={500} color={fileExists ? undefined : "red"}>
              {item.name} {fileExists ? "" : "(file missing)"}
            </Text>
          </Group>
        </td>
        <td>{item.elo}</td>
        <td>
          <Group>
            <ActionIcon>
              <IconEdit size={20} onClick={() => toggleEditModal()} />
            </ActionIcon>
            <ActionIcon>
              <IconX size={20} onClick={() => toggleDeleteModal()} />
            </ActionIcon>
          </Group>
        </td>
      </tr>
    </>
  );
}
