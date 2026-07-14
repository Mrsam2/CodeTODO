import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Input, Row, SectionHeader, EmptyState } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';

export default function VaultScreen() {
  const store = useAppStore();
  const [tab, setTab] = useState<'notes' | 'links' | 'ideas'>('notes');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaDesc, setIdeaDesc] = useState('');

  const addNote = () => {
    if (!noteTitle.trim()) return;
    store.addNote({
      title: noteTitle.trim(),
      content: noteContent.trim(),
      tags: [],
    });
    setNoteTitle('');
    setNoteContent('');
  };

  const addLink = () => {
    if (!linkTitle.trim() || !linkUrl.trim()) return;
    store.addLink({
      title: linkTitle.trim(),
      url: linkUrl.trim(),
      categoryId: null,
      notes: '',
    });
    setLinkTitle('');
    setLinkUrl('');
  };

  const addIdea = () => {
    if (!ideaTitle.trim()) return;
    store.addFutureIdea({
      title: ideaTitle.trim(),
      description: ideaDesc.trim(),
      priority: 'medium',
    });
    setIdeaTitle('');
    setIdeaDesc('');
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader title="Vault" />

        <Row style={{ gap: Spacing.one, marginBottom: Spacing.two }}>
          {(['notes', 'links', 'ideas'] as const).map((t) => (
            <Button
              key={t}
              small
              title={t.charAt(0).toUpperCase() + t.slice(1)}
              onPress={() => setTab(t)}
              variant={tab === t ? 'primary' : 'secondary'}
            />
          ))}
        </Row>

        {tab === 'notes' && (
          <>
            <Card>
              <Input value={noteTitle} onChangeText={setNoteTitle} placeholder="Note title" />
              <Input
                value={noteContent}
                onChangeText={setNoteContent}
                placeholder="Note content"
                multiline
              />
              <Button title="Save note" onPress={addNote} disabled={!noteTitle.trim()} />
            </Card>

            {store.notes.length === 0 ? (
              <EmptyState title="No notes yet" />
            ) : (
              store.notes.map((note) => (
                <Card key={note.id}>
                  <ThemedText type="bodyBold">{note.title}</ThemedText>
                  {note.content ? (
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                      {note.content}
                    </ThemedText>
                  ) : null}
                  <Button
                    small
                    title="Delete"
                    variant="ghost"
                    onPress={() => store.deleteNote(note.id)}
                  />
                </Card>
              ))
            )}
          </>
        )}

        {tab === 'links' && (
          <>
            <Card>
              <Input value={linkTitle} onChangeText={setLinkTitle} placeholder="Link title" />
              <Input value={linkUrl} onChangeText={setLinkUrl} placeholder="URL" />
              <Button title="Save link" onPress={addLink} disabled={!linkTitle.trim() || !linkUrl.trim()} />
            </Card>

            {store.savedLinks.length === 0 ? (
              <EmptyState title="No links yet" />
            ) : (
              store.savedLinks.map((link) => (
                <Card key={link.id}>
                  <ThemedText type="bodyBold">{link.title}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                    {link.url}
                  </ThemedText>
                  <Button
                    small
                    title="Delete"
                    variant="ghost"
                    onPress={() => store.deleteLink(link.id)}
                  />
                </Card>
              ))
            )}
          </>
        )}

        {tab === 'ideas' && (
          <>
            <Card>
              <Input value={ideaTitle} onChangeText={setIdeaTitle} placeholder="Idea title" />
              <Input value={ideaDesc} onChangeText={setIdeaDesc} placeholder="Description" multiline />
              <Button title="Save idea" onPress={addIdea} disabled={!ideaTitle.trim()} />
            </Card>

            {store.futureIdeas.length === 0 ? (
              <EmptyState title="No ideas yet" />
            ) : (
              store.futureIdeas.map((idea) => (
                <Card key={idea.id}>
                  <ThemedText type="bodyBold">{idea.title}</ThemedText>
                  {idea.description ? (
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                      {idea.description}
                    </ThemedText>
                  ) : null}
                  <Button
                    small
                    title="Delete"
                    variant="ghost"
                    onPress={() => store.deleteFutureIdea(idea.id)}
                  />
                </Card>
              ))
            )}
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: 120 },
});
